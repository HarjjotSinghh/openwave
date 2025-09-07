import { AVAX, Buffer, BinTools, BufferReader, BufferWriter } from "AVAX";
import { KeyPair } from "AVAX/dist/common/keypair";
import { Tx } from "AVAX/dist/common/tx";
import { TxBuilder } from "AVAX/dist/common/txBuilder";
import { TxStatus } from "AVAX/dist/common/txStatus";
import { getTxStatus } from "../lib/AVAX/txhelpers";

// Initialize AVAX client
const ava = new AVAX("localhost", 9650, "http");

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