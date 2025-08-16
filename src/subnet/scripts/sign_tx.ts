import { Avalanche, Buffer, BinTools, BufferReader, BufferWriter } from "avalanche";
import { KeyPair } from "avalanche/dist/common/keypair";
import { Tx } from "avalanche/dist/common/tx";
import { TxBuilder } from "avalanche/dist/common/txBuilder";
import { TxStatus } from "avalanche/dist/common/txStatus";
import { getTxStatus } from "../lib/avalanche/txhelpers";

// Initialize Avalanche client
const ava = new Avalanche("localhost", 9650, "http");

// Function to sign a transaction
async function signTransaction(tx: Tx, keyPair: KeyPair): Promise<Tx> {
    const txBuilder = new TxBuilder();
    const signedTx = txBuilder.signTx(tx, keyPair);
    return signedTx;
}

// Example usage
(async () => {
    const keyPair = ava.keyChain().makeKeyPair();
    const tx = new Tx(); // Create a new transaction

    // Sign the transaction
    const signedTx = await signTransaction(tx, keyPair);

    // Send the transaction to the network
    const txID = await signedTx.send();
    console.log(`Transaction sent with ID: ${txID}`);

    // Check the transaction status
    const status = await getTxStatus(txID);
    console.log(`Transaction status: ${status}`);
})();