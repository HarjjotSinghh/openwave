import { NextApiRequest, NextApiResponse } from 'next';
import { AVAX } from 'AVAX';
import { createSubnetTx } from '../../../lib/AVAX/txHelpers';
import { getAVAXClient } from '../../../lib/AVAX/client';

export default async function createSubnet(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subnetId, tokenSymbol, vmType, gasFeeConfig } = req.body;

    if (!subnetId || !tokenSymbol || !vmType || !gasFeeConfig) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const AVAX = getAVAXClient();
        const tx = createSubnetTx(AVAX, subnetId, tokenSymbol, vmType, gasFeeConfig);
        const txID = await AVAX.buildAndSend(tx);

        return res.status(200).json({ txID });
    } catch (error) {
        console.error('Error creating subnet:', error);
        return res.status(500).json({ error: 'Failed to create subnet' });
    }
}