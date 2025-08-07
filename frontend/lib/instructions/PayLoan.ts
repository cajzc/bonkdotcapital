global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { createLoanInfoPDA, createOpenLoanPDA, createCollateralVaultPDA, createAssociatedTokenAccountPDA, createCollateralVaultTokenAccountPDA } from '../CreatePDAs';

// Types for pay loan operation
export interface PayLoanData {
  tokenMint: string; // loan token mint (what you borrowed)
  collateralTokenMint: string; // collateral token mint (what you used as collateral)
  lenderPublicKey: string;
}

// SOL mint address for checking if paying back in SOL
const SOL_MINT = 'So11111111111111111111111111111111111111112';

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
  const collateralTokenMint = new PublicKey(payLoanData.collateralTokenMint);
  const lenderPublicKey = new PublicKey(payLoanData.lenderPublicKey);

  console.log('Token Mint:', tokenMint.toString());
  console.log('Lender Public Key:', lenderPublicKey.toString());
  console.log('Borrower Public Key (connected wallet):', borrowerPublicKey.toString());

  // Create PDAs using helpers - note: loanInfoPDA now uses loanTokenMint
  const loanInfoPda = createLoanInfoPDA(lenderPublicKey, tokenMint, program.programId);
  const openLoanPda = createOpenLoanPDA(loanInfoPda, borrowerPublicKey, program.programId);
  const collateralVaultPda = createCollateralVaultPDA(loanInfoPda, borrowerPublicKey, program.programId);
  
  console.log('Expected loanInfoPDA:', 'BbdFE6GfTDRu1uDDefFB2dpfUFKFntxCXaN6LL4FVg6u');
  console.log('Expected collateralVaultPDA:', '6DhP9XDWikQR62zhSxfKbR5AA8Kgw3fZBKRXWyzMRWXC');
  
  // Check if paying back in SOL or tokens
  const isSOL = payLoanData.tokenMint === SOL_MINT;
  console.log('Token being repaid:', payLoanData.tokenMint === SOL_MINT ? 'SOL' : 'BONK');
  
  // lenderTokenAccount is always required (not optional in IDL)
  const lenderTokenAccount = createAssociatedTokenAccountPDA(lenderPublicKey, tokenMint);
  
  // These accounts are optional in the updated IDL
  let borrowerCollateralTokenAccount: PublicKey | undefined;
  let borrowerRepayTokenAccount: PublicKey | undefined;
  let collateralVaultTokenAccount: PublicKey | undefined;
  
  if (!isSOL) {
    borrowerCollateralTokenAccount = createAssociatedTokenAccountPDA(borrowerPublicKey, collateralTokenMint);
    borrowerRepayTokenAccount = createAssociatedTokenAccountPDA(borrowerPublicKey, tokenMint);
    collateralVaultTokenAccount = createCollateralVaultTokenAccountPDA(collateralVaultPda, collateralTokenMint);
  } 

  console.log('Loan Info PDA:', loanInfoPda.toString());
  console.log('Open Loan PDA:', openLoanPda.toString());
  console.log('Collateral Vault PDA:', collateralVaultPda.toString());
  console.log('Lender Token Account (always required):', lenderTokenAccount.toString());
  console.log('Is SOL payment:', isSOL);
  
  if (!isSOL) {
    console.log('Borrower Collateral Token Account:', borrowerCollateralTokenAccount?.toString());
    console.log('Borrower Repay Token Account:', borrowerRepayTokenAccount?.toString());
    console.log('Collateral Vault Token Account:', collateralVaultTokenAccount?.toString());
  }

  try {
    console.log('About to call payLoan instruction...');
    console.log('Payment type:', isSOL ? 'SOL' : 'Token');
    
    // Build accounts object conditionally based on SOL vs tokens
    const accounts: any = {
      openLoan: openLoanPda,
      loanInfo: loanInfoPda,
      collateralVault: collateralVaultPda,
      borrower: borrowerPublicKey,
      lender: lenderPublicKey,
      loanTokenMint: tokenMint, // Updated to loanTokenMint
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      lenderTokenAccount: lenderTokenAccount, // Always required
    };

    // Add optional token accounts only for non-SOL payments
    if (!isSOL) {
      accounts.collateralVaultTokenAccount = collateralVaultTokenAccount;
      accounts.borrowerCollateralTokenAccount = borrowerCollateralTokenAccount;
      accounts.borrowerRepayTokenAccount = borrowerRepayTokenAccount;
    } else {
      // For SOL payments, we don't include the optional token accounts
      console.log('SOL payment - excluding optional token accounts (borrowerCollateralTokenAccount, borrowerRepayTokenAccount, collateralVaultTokenAccount)');
    }

    const tx = await program.methods
      .payLoan()
      .accounts(accounts)
      .rpc();

    console.log('Pay loan transaction successful:', tx);
    return tx;
  } catch (error) {
    console.error('Pay loan transaction failed:', error);
    throw error;
  }
}
