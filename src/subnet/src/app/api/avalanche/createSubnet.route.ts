import { NextApiRequest, NextApiResponse } from 'next';
import { Avalanche } from 'avalanche';
import { createSubnetTx } from '../../../lib/avalanche/txHelpers';
import { getAvalancheClient } from '../../../lib/avalanche/client';

export default async function createSubnet(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subnetId, tokenSymbol, vmType, gasFeeConfig } = req.body;

    if (!subnetId || !tokenSymbol || !vmType || !gasFeeConfig) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const avalanche = getAvalancheClient();
        const tx = createSubnetTx(avalanche, subnetId, tokenSymbol, vmType, gasFeeConfig);
        const txID = await avalanche.buildAndSend(tx);

        return res.status(200).json({ txID });
    } catch (error) {
        console.error('Error creating subnet:', error);
        return res.status(500).json({ error: 'Failed to create subnet' });
    }
}