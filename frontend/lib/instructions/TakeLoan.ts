global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { Program } from '@coral-xyz/anchor';
import { createLoanInfoPDA, createOpenLoanPDA, createVaultPDA, createCollateralVaultPDA } from '../CreatePDAs';
import { BN } from '@coral-xyz/anchor';

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
  takeLoanData: TakeLoanData
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
  const signedTransaction = await wallet?.signTransaction(transaction);
  if (!signedTransaction) {
    throw new Error('Failed to sign transaction');
  }

  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(signature);
  
  return signature;
}
