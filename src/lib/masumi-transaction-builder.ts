import type { LucidEvolution } from '@lucid-evolution/lucid';
import type { MasumiAgent } from './masumi-agent-discovery';

export interface MasumiPaymentTx {
  agentIdentifier: string;
  recipientAddress: string;
  amounts: Array<{
    unit: string;
    amount: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Build and submit a payment transaction to a Masumi agent
 * Following the official Masumi payment flow
 */
export async function buildMasumiPaymentTx(
  lucid: LucidEvolution,
  paymentIdentifier: string,
  lovelaceAmount: bigint,
  metadata?: Record<string, any>
): Promise<string> {
  try {
    console.log('Building Masumi payment transaction:', {
      paymentIdentifier,
      lovelaceAmount: lovelaceAmount.toString()
    });

    // Build the transaction
    let tx = lucid
      .newTx()
      .pay.ToAddress(paymentIdentifier, { lovelace: lovelaceAmount });

    // Add metadata if provided
    if (metadata) {
      // Masumi payment metadata standard (label 674)
      tx = tx.attachMetadata(674, {
        msg: ['Masumi Agent Payment'],
        ...metadata
      });
    }

    // Complete the transaction
    const completedTx = await tx.complete();
    
    // Sign the transaction with the wallet
    const signedTx = await completedTx.sign.withWallet().complete();
    
    // Submit the transaction
    const txHash = await signedTx.submit();
    
    console.log('Transaction submitted:', txHash);
    return txHash;

  } catch (error: any) {
    console.error('Failed to build payment transaction:', error);
    throw new Error(`Transaction building failed: ${error.message}`);
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(lucid: LucidEvolution): Promise<{
  lovelace: bigint;
  assets: Record<string, bigint>;
}> {
  try {
    const utxos = await lucid.wallet().getUtxos();
    
    let lovelace = BigInt(0);
    const assets: Record<string, bigint> = {};
    
    for (const utxo of utxos) {
      lovelace += utxo.assets['lovelace'];
      
      for (const [unit, amount] of Object.entries(utxo.assets)) {
        if (unit !== 'lovelace') {
          assets[unit] = (assets[unit] || BigInt(0)) + amount;
        }
      }
    }
    
    return { lovelace, assets };
  } catch (error: any) {
    console.error('Failed to get wallet balance:', error);
    throw new Error(`Balance check failed: ${error.message}`);
  }
}

/**
 * Check if wallet has sufficient balance for payment
 */
export async function checkSufficientBalance(
  lucid: LucidEvolution,
  lovelaceAmount: bigint,
  feeBuffer: bigint = BigInt(2_000_000) // 2 ADA fee buffer
): Promise<{ sufficient: boolean; available: bigint; required: bigint }> {
  try {
    const balance = await getWalletBalance(lucid);
    const totalRequired = lovelaceAmount + feeBuffer;
    
    return {
      sufficient: balance.lovelace >= totalRequired,
      available: balance.lovelace,
      required: totalRequired
    };
  } catch (error: any) {
    console.error('Failed to check balance:', error);
    throw new Error(`Balance check failed: ${error.message}`);
  }
}

/**
 * Wait for transaction confirmation using Lucid's awaitTx
 */
export async function waitForTxConfirmation(
  lucid: LucidEvolution,
  txHash: string
): Promise<boolean> {
  try {
    console.log(`Waiting for transaction confirmation: ${txHash}`);
    
    // Lucid's awaitTx will poll Blockfrost automatically
    const confirmed = await lucid.awaitTx(txHash);
    
    if (confirmed) {
      console.log('Transaction confirmed on-chain!');
    }
    
    return confirmed;
  } catch (error: any) {
    console.error('Failed to confirm transaction:', error);
    return false;
  }
} 