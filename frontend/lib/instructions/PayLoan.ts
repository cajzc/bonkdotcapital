global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { createLoanInfoPDA, createOpenLoanPDA, createCollateralVaultPDA } from '../CreatePDAs';

// Types for pay loan operation
export interface PayLoanData {
  tokenMint: string;
  lenderPublicKey: string;
  borrowerPublicKey: string;
}

// Pay loan operation (pay_loan instruction)
export async function payLoan(
  program: Program<any>,
  connection: Connection,
  wallet: any,
  borrowerPublicKey: PublicKey,
  payLoanData: PayLoanData
): Promise<string> {
  console.log('=== PAY LOAN DEBUG ===');
  console.log('Program ID:', program?.programId?.toString());
  
  const tokenMint = new PublicKey(payLoanData.tokenMint);
  const lenderPublicKey = new PublicKey(payLoanData.lenderPublicKey);

  console.log('Token Mint:', tokenMint.toString());
  console.log('Lender Public Key:', lenderPublicKey.toString());
  console.log('Borrower Public Key:', borrowerPublicKey.toString());

  // Create PDAs using helpers
  const loanInfoPda = createLoanInfoPDA(lenderPublicKey, tokenMint, program.programId);
  const openLoanPda = createOpenLoanPDA(loanInfoPda, borrowerPublicKey, program.programId);
  const collateralVaultPda = createCollateralVaultPDA(loanInfoPda, borrowerPublicKey, program.programId);

  console.log('Loan Info PDA:', loanInfoPda.toString());
  console.log('Open Loan PDA:', openLoanPda.toString());
  console.log('Collateral Vault PDA:', collateralVaultPda.toString());

  // Find the borrower's token account for the mint
  const borrowerTokenAccounts = await connection.getTokenAccountsByOwner(
    borrowerPublicKey,
    {
      mint: tokenMint
    }
  );

  if (borrowerTokenAccounts.value.length === 0) {
    throw new Error('No borrower token account found for the selected token');
  }

  const borrowerTokenAccount = borrowerTokenAccounts.value[0].pubkey;
  console.log('Borrower Token Account:', borrowerTokenAccount.toString());

  // Find the lender's token account for the mint
  const lenderTokenAccounts = await connection.getTokenAccountsByOwner(
    lenderPublicKey,
    {
      mint: tokenMint
    }
  );

  if (lenderTokenAccounts.value.length === 0) {
    throw new Error('No lender token account found for the selected token');
  }

  const lenderTokenAccount = lenderTokenAccounts.value[0].pubkey;
  console.log('Lender Token Account:', lenderTokenAccount.toString());

  try {
    console.log('About to call payLoan instruction...');
    
    const tx = await program.methods
      .payLoan()
      .accounts({
        openLoan: openLoanPda,
        loanInfo: loanInfoPda,
        collateralVault: collateralVaultPda,
        borrowerTokenAccount: borrowerTokenAccount,
        lenderTokenAccount: lenderTokenAccount,
        borrower: borrowerPublicKey,
        lender: lenderPublicKey,
        tokenMint: tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log('Pay loan transaction successful:', tx);
    return tx;
  } catch (error) {
    console.error('Pay loan transaction failed:', error);
    throw error;
  }
}
