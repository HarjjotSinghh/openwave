import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { db } from "../../../db/index";
import { users } from "../../../db/schema";
import { and, desc, eq, like } from "drizzle-orm";

const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: 'https://s3.tebi.io',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Allow only images and PDF
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'tif', 'tiff', 'pdf',
]);

const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() || '';

// Encryption functions
const ENCRYPTION_KEY = process.env.FILE_ENCRYPTION_KEY || 'your-32-char-secret-key-here!!';
const ALGORITHM = 'aes-256-cbc';

function encryptData(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptData(encryptedText: string): string {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedData = textParts.join(':');
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateSecureFileName(originalName: string, contributorWallet: string, maintainerWallet: string): string {
  const timestamp = Date.now();
  const contributorPrefix = contributorWallet.substring(0, 4);
  const contributorSuffix = contributorWallet.slice(-4);
  const maintainerPrefix = maintainerWallet.substring(0, 4);
  const maintainerSuffix = maintainerWallet.slice(-4);
  
  // Create access control data
  const accessData = {
    contributor: contributorPrefix + contributorSuffix,
    maintainer: maintainerPrefix + maintainerSuffix,
    timestamp
  };
  
  const encryptedAccess = encryptData(JSON.stringify(accessData));
  const ext = getExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  
  return `${baseName}_${timestamp}_${encryptedAccess.replace(/[^a-zA-Z0-9]/g, '')}.${ext}`;
}

export async function POST(request: Request) {
  try {
    const { fileName, fileType, contributorUsername, maintainerUsername } = await request.json();

    if (!fileName || !fileType || !contributorUsername || !maintainerUsername) {
      return NextResponse.json(
        { error: 'Missing required parameters: fileName, fileType, contributorUsername, or maintainerUsername' },
        { status: 400 }
      );
    }

    // Fetch contributor wallet address from database
    const contributorUser = await db.select({
      metaMask: users.metaMask
    }).from(users).where(eq(users.id, contributorUsername)).limit(1);

    if (!contributorUser.length || !contributorUser[0].metaMask) {
      return NextResponse.json(
        { error: 'Contributor not found or MetaMask wallet not set' },
        { status: 404 }
      );
    }

    // Fetch maintainer wallet address from database
    const maintainerUser = await db.select({
      maintainerWallet: users.maintainerWallet
    }).from(users).where(eq(users.id, maintainerUsername)).limit(1);

    if (!maintainerUser.length || !maintainerUser[0].maintainerWallet) {
      return NextResponse.json(
        { error: 'Maintainer not found or maintainer wallet not set' },
        { status: 404 }
      );
    }

    const contributorWallet = contributorUser[0].metaMask;
    const maintainerWallet = maintainerUser[0].maintainerWallet;

    // Validate wallet addresses (basic validation)
    if (contributorWallet.length < 8 || maintainerWallet.length < 8) {
      return NextResponse.json(
        { error: 'Invalid wallet addresses' },
        { status: 400 }
      );
    }

    // Validate type and extension (only images and PDF allowed)
    const ext = getExtension(fileName);
    if (!ALLOWED_MIME_TYPES.has(fileType) || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Only image and PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Generate secure filename with encrypted access control
    const secureFileName = generateSecureFileName(fileName, contributorWallet, maintainerWallet);

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: secureFileName,
      ContentType: fileType,
      ACL: 'public-read',
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': Date.now().toString(),
        'contributor-username': contributorUsername,
        'maintainer-username': maintainerUsername
      }
    });

    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 60,
    });

    // Generate a public URL for the object
    const publicUrl = `https://s3.tebi.io/gitfund/${secureFileName}`;

    return NextResponse.json({ 
      signedUrl,
      publicUrl,
      secureFileName
    });
  } catch (error) {
    console.error('Error generating S3 signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('fileName');
        const contributorUsername = searchParams.get('contributorUsername');
        const maintainerUsername = searchParams.get('maintainerUsername');
        
        if (!fileName || !contributorUsername || !maintainerUsername) {
            return NextResponse.json(
                { error: 'Missing required parameters: fileName, contributorUsername, or maintainerUsername' },
                { status: 400 }
            );
        }

        // Validate extension (only images and PDF allowed)
        const ext = getExtension(fileName);
        if (!ALLOWED_EXTENSIONS.has(ext)) {
            return NextResponse.json(
                { error: 'Only image and PDF files are allowed.' },
                { status: 400 }
            );
        }

        // Fetch contributor wallet address from database
        const contributorUser = await db.select({
          metaMask: users.metaMask
        }).from(users).where(eq(users.id, contributorUsername)).limit(1);

        if (!contributorUser.length || !contributorUser[0].metaMask) {
          return NextResponse.json(
            { error: 'Contributor not found or MetaMask wallet not set' },
            { status: 404 }
          );
        }

        // Fetch maintainer wallet address from database
        const maintainerUser = await db.select({
          maintainerWallet: users.maintainerWallet
        }).from(users).where(eq(users.id, maintainerUsername)).limit(1);

        if (!maintainerUser.length || !maintainerUser[0].maintainerWallet) {
          return NextResponse.json(
            { error: 'Maintainer not found or maintainer wallet not set' },
            { status: 404 }
          );
        }

        const contributorWallet = contributorUser[0].metaMask;
        const maintainerWallet = maintainerUser[0].maintainerWallet;

        // Extract and verify access control from filename
        try {
          const parts = fileName.split('_');
          if (parts.length < 3) {
            throw new Error('Invalid filename format');
          }
          
          const encryptedPart = parts[parts.length - 1].split('.')[0];
          const decryptedAccess = decryptData(encryptedPart);
          const accessData = JSON.parse(decryptedAccess);
          
          const contributorCheck = contributorWallet.substring(0, 4) + contributorWallet.slice(-4);
          const maintainerCheck = maintainerWallet.substring(0, 4) + maintainerWallet.slice(-4);
          
          if (accessData.contributor !== contributorCheck || accessData.maintainer !== maintainerCheck) {
            return NextResponse.json(
              { error: 'Access denied: Invalid wallet credentials' },
              { status: 403 }
            );
          }
        } catch (decryptError) {
          return NextResponse.json(
            { error: 'Access denied: Invalid file access token' },
            { status: 403 }
          );
        }

        const getObjectParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
        };

        const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand(getObjectParams), {
            expiresIn: 60,
        });

        const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.tebi.io/${fileName}`;

        return NextResponse.json({ 
            signedUrl,
            publicUrl
        });
    } catch (error) {
        console.error('Error generating S3 download URL:', error);
        return NextResponse.json(
            { error: 'Failed to generate download URL' },
            { status: 500 }
        );
    }
}