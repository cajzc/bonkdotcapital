global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { Program } from '@coral-xyz/anchor';
import { createLoanInfoPDA, createOpenLoanPDA, createVaultPDA, createCollateralVaultPDA } from '../CreatePDAs';
import { BN } from '@coral-xyz/anchor';
import { apiClient } from '../apiClient';

// Types for take loan operation
export interface TakeLoanData {
  tokenMint: string;
  lenderPublicKey: string;
  amount: string;
}

// Take loan operation (take_loan instruction)
export async function takeLoan(
  program: Program,
  connection: Connection,
  wallet: any,
  borrowerPublicKey: PublicKey,
  takeLoanData: TakeLoanData,
  offerId?: string, // Optional offer ID for backend update
  offerDuration?: number // Optional offer duration in days for proper end date calculation
): Promise<string> {
  // Validate inputs
  if (!takeLoanData.tokenMint) {
    throw new Error('tokenMint is required');
  }
  if (!takeLoanData.lenderPublicKey) {
    throw new Error('lenderPublicKey is required');
  }
  if (!borrowerPublicKey) {
    throw new Error('borrowerPublicKey is required');
  }
  if (!program.programId) {
    throw new Error('program.programId is required');
  }

  console.log('Creating PublicKeys...');
  const tokenMint = new PublicKey(takeLoanData.tokenMint);
  const lenderPublicKey = new PublicKey(takeLoanData.lenderPublicKey);
  
  console.log('Token Mint:', tokenMint.toString());
  console.log('Lender Public Key:', lenderPublicKey.toString());
  console.log('Borrower Public Key:', borrowerPublicKey.toString());
  console.log('Program ID:', program.programId.toString());

  // Validate that the token mint is a valid mint account
  try {
    const mintAccount = await connection.getAccountInfo(tokenMint);
    if (!mintAccount) {
      throw new Error(`Invalid token mint: ${tokenMint.toString()} does not exist on-chain.`);
    }
    if (mintAccount.data.length !== 82) { // SPL token mint accounts are 82 bytes
      throw new Error(`Invalid token mint: ${tokenMint.toString()} is not a valid SPL token mint account.`);
    }
    console.log('Token mint validated successfully');
  } catch (error) {
    console.error('Token mint validation failed:', error);
    throw error;
  }

  // Create PDAs using helpers
  console.log('Creating PDAs...');
  const loanInfoPda = createLoanInfoPDA(lenderPublicKey, tokenMint, program.programId);
  const openLoanPda = createOpenLoanPDA(loanInfoPda, borrowerPublicKey, program.programId);
  const vaultPda = createVaultPDA(loanInfoPda, program.programId);
  const collateralVaultPda = createCollateralVaultPDA(loanInfoPda, borrowerPublicKey, program.programId);

  console.log('Loan Info PDA:', loanInfoPda.toString());
  console.log('Open Loan PDA:', openLoanPda.toString());
  console.log('Vault PDA:', vaultPda.toString());
  console.log('Collateral Vault PDA:', collateralVaultPda.toString());

  // Check if the loan info account exists (to verify the loan offer was created)
  try {
    const loanInfoAccount = await connection.getAccountInfo(loanInfoPda);
    if (!loanInfoAccount) {
      throw new Error(`Loan offer not found on-chain. The loan info account ${loanInfoPda.toString()} does not exist. Please ensure the loan offer was successfully created.`);
    }
    console.log('Loan info account found:', loanInfoAccount.owner.toString());
    
    // Check if the vault account exists
    const vaultAccount = await connection.getAccountInfo(vaultPda);
    if (!vaultAccount) {
      throw new Error(`Loan vault not found on-chain. The vault account ${vaultPda.toString()} does not exist. This loan offer was not properly initialized.`);
    }
    console.log('Vault account found:', vaultAccount.owner.toString());
  } catch (error) {
    console.error('Account validation failed:', error);
    throw error;
  }

  // Derive the Associated Token Account (ATA) for the borrower
  console.log('Deriving borrower ATA...');
  console.log('TOKEN_PROGRAM_ID:', TOKEN_PROGRAM_ID.toString());
  
  const [borrowerTokenAccount] = PublicKey.findProgramAddressSync(
    [
      borrowerPublicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
  );
  console.log('Using borrower ATA:', borrowerTokenAccount.toString());

  // Check if the borrower's ATA exists, and provide guidance if it doesn't
  try {
    const borrowerATAAccount = await connection.getAccountInfo(borrowerTokenAccount);
    if (!borrowerATAAccount) {
      throw new Error(`Borrower's Associated Token Account (${borrowerTokenAccount.toString()}) does not exist. You need to create an ATA for the token ${tokenMint.toString()} before taking this loan. Try sending yourself some of this token first to create the account.`);
    }
    console.log('Borrower ATA account found and validated');
  } catch (error) {
    console.error('Borrower ATA validation failed:', error);
    throw error;
  }

  // Create the instruction
  console.log('Creating instruction...');
  const instruction = await program.methods
    .takeLoan()
    .accounts({
      openLoan: openLoanPda,
      collateralVault: collateralVaultPda,
      borrowerTokenAccount: borrowerTokenAccount,
      vault: vaultPda,
      loanInfo: loanInfoPda,
      borrower: borrowerPublicKey,
      lender: lenderPublicKey,
      tokenMint: tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY,
    })
    .instruction();

  // Create transaction
  const transaction = new Transaction();
  transaction.add(instruction);

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = borrowerPublicKey;

  // Sign and send transaction using the wallet
  console.log('Signing transaction...');
  const signedTransaction = await wallet?.signTransaction(transaction);
  if (!signedTransaction) {
    throw new Error('Failed to sign transaction');
  }

  console.log('Sending transaction...');
  try {
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    console.log('Transaction sent with signature:', signature);
    
    console.log('Confirming transaction...');
    await connection.confirmTransaction(signature);
    console.log('Transaction confirmed successfully');
    
    // Update backend database if offerId is provided
    if (offerId) {
      try {
        console.log('Updating backend database for loan acceptance...');
        
        // Calculate loan start and end dates using actual offer duration
        const startDate = new Date().toISOString();
        const durationDays = offerDuration || 30; // Use provided duration or fallback to 30 days
        const endDate = new Date(Date.now() + (durationDays * 24 * 60 * 60 * 1000)).toISOString();
        
        const loanRecord = await apiClient.acceptLoanOffer(offerId, {
          borrower_address: borrowerPublicKey.toString(),
          transaction_signature: signature,
          open_loan_pda: openLoanPda.toString(),
          collateral_vault_pda: collateralVaultPda.toString(),
          start_date: startDate,
          end_date: endDate,
        });
        console.log('Backend database updated successfully:', loanRecord);
      } catch (backendError) {
        console.error('Failed to update backend database:', backendError);
        
        // Provide user-friendly message based on error type
        if (backendError instanceof Error && backendError.message.includes('404')) {
          console.warn('Backend loan acceptance endpoint not implemented yet. Loan was successful on-chain.');
        } else {
          console.warn('Loan was taken successfully on-chain, but backend update failed. This may cause UI inconsistencies.');
        }
        
        // Don't throw here - the blockchain transaction was successful
        // The user has successfully taken the loan even if backend update fails
      }
    }
    
    return signature;
  } catch (txError) {
    console.error('Transaction execution failed:', txError);
    
    // Provide user-friendly error messages
    if (txError && typeof txError === 'object' && 'message' in txError) {
      const errorMessage = txError.message as string;
      
      if (errorMessage.includes('AccountNotInitialized')) {
        throw new Error('One of the required accounts is not initialized. This loan offer may not have been properly created on-chain.');
      }
      if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient funds to complete this transaction. You need SOL for transaction fees.');
      }
      if (errorMessage.includes('custom program error: 0xbc4')) {
        throw new Error('Account not initialized error (0xbc4). The loan vault or other required accounts are missing.');
      }
    }
    
    throw txError;
  }
}
