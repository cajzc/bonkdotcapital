global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { Program } from '@coral-xyz/anchor';
import { createLoanOfferPDA, createLoanPDA, createVaultPDA, createObligationPDA } from '../CreatePDAs';

// Types for take loan operation
export interface TakeLoanData {
  tokenMint: string;
  lenderPublicKey: string;
  amount: string;
}

// Take loan operation (accept_loan instruction)
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
  const loanOfferPda = createLoanOfferPDA(lenderPublicKey, tokenMint, program.programId);
  const loanPda = createLoanPDA(borrowerPublicKey, loanOfferPda, program.programId);
  const vaultPda = createVaultPDA(loanOfferPda, program.programId);
  const obligationPda = createObligationPDA(borrowerPublicKey, program.programId);

  console.log('Loan Offer PDA:', loanOfferPda.toString());
  console.log('Loan PDA:', loanPda.toString());
  console.log('Vault PDA:', vaultPda.toString());
  console.log('Obligation PDA:', obligationPda.toString());

  // Derive the Associated Token Account (ATA) for the borrower
  console.log('Deriving borrower ATA...');
  console.log('TOKEN_PROGRAM_ID:', TOKEN_PROGRAM_ID.toString());
  console.log('ASSOCIATED_TOKEN_PROGRAM_ID:', ASSOCIATED_PROGRAM_ID.toString());
  
  const [borrowerTokenAccount] = PublicKey.findProgramAddressSync(
    [
      borrowerPublicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    ASSOCIATED_PROGRAM_ID
  );
  console.log('Using borrower ATA:', borrowerTokenAccount.toString());

  // Create the instruction
  console.log('Creating instruction...');
  const instruction = await program.methods
    .intializeAcceptLoan(
      0 // bump 
    )
    .accounts({
      loanOffer: loanOfferPda,
      loan: loanPda,
      obligation: obligationPda,
      borrowerTokenAccount: borrowerTokenAccount,
      vault: vaultPda,
      borrower: borrowerPublicKey,
      tokenMint: tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
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
