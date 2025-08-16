'use client';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';

import { useState } from 'react';
const Example = () => {
  const [files, setFiles] = useState<File[] | undefined>();
  const handleDrop = (files: File[]) => {
    console.log(files);
    setFiles(files);
  };
  return (
    <Dropzone
  accept={{
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf']
  }}
  maxFiles={5}
  maxSize={10 * 1024 * 1024} // 10MB
  s3Upload={{
    contributorWallet: "0x1234567890abcdef1234567890abcdef12345678",
    maintainerWallet: "0xabcdef1234567890abcdef1234567890abcdef12",
    onUploadComplete: (urls) => {
      console.log('Files uploaded successfully:', urls);
    },
    onUploadError: (error) => {
      console.error('Upload failed:', error);
    }
  }}
>
  <DropzoneEmptyState />
  <DropzoneContent />
</Dropzone>
  );
};
export default Example;
