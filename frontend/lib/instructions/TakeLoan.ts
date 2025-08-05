global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { Program } from '@coral-xyz/anchor';
import { createLoanOfferPDA, createLoanPDA, createVaultPDA } from '../CreatePDAs';

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
  const tokenMint = new PublicKey(takeLoanData.tokenMint);
  const lenderPublicKey = new PublicKey(takeLoanData.lenderPublicKey);

  // Create PDAs using helpers
  const loanOfferPda = createLoanOfferPDA(lenderPublicKey, tokenMint, program.programId);
  const loanPda = createLoanPDA(borrowerPublicKey, loanOfferPda, program.programId);
  const vaultPda = createVaultPDA(loanOfferPda, program.programId);

  // Derive the Associated Token Account (ATA) for the borrower
  // Using the standard ATA derivation formula to avoid Buffer dependency
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
  const instruction = await program.methods
    .intializeAcceptLoan(
      0 // bump (Anchor will handle this)
    )
    .accounts({
      loanOffer: loanOfferPda,
      loan: loanPda,
      borrowerTokenAccount: borrowerTokenAccount,
      vault: vaultPda,
      borrower: borrowerPublicKey,
      tokenMint: tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY,
    })
    .instruction();

  // Create and send transaction
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
