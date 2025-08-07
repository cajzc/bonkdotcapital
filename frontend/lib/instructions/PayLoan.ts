global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { createLoanInfoPDA, createOpenLoanPDA, createCollateralVaultPDA, createAssociatedTokenAccountPDA, createCollateralVaultTokenAccountPDA } from '../CreatePDAs';

// Types for pay loan operation
export interface PayLoanData {
  borrowedTokenMint: string; // loan token mint (what you borrowed)
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
  
  const borrowedTokenMint = new PublicKey(payLoanData.borrowedTokenMint);
  const collateralTokenMint = new PublicKey(payLoanData.collateralTokenMint);
  const lenderPublicKey = new PublicKey(payLoanData.lenderPublicKey);

  console.log('Borrowed Token Mint:', borrowedTokenMint.toString());
  console.log('Collateral Token Mint:', collateralTokenMint.toString());
  console.log('Lender Public Key:', lenderPublicKey.toString());
  console.log('Borrower Public Key (connected wallet):', borrowerPublicKey.toString());

  // Create PDAs using helpers
  const loanInfoPda = createLoanInfoPDA(lenderPublicKey, borrowedTokenMint, program.programId);
  const openLoanPda = createOpenLoanPDA(loanInfoPda, borrowerPublicKey, program.programId);
  const collateralVaultPda = createCollateralVaultPDA(loanInfoPda, borrowerPublicKey, program.programId);
  
  console.log('Expected loanInfoPDA:', 'BbdFE6GfTDRu1uDDefFB2dpfUFKFntxCXaN6LL4FVg6u');
  console.log('Expected collateralVaultPDA:', '6DhP9XDWikQR62zhSxfKbR5AA8Kgw3fZBKRXWyzMRWXC');
  
  // Check if collateral is SOL
  const isSOLCollateral = payLoanData.collateralTokenMint === SOL_MINT;
  console.log('Token being repaid:', payLoanData.borrowedTokenMint === SOL_MINT ? 'SOL' : 'BONK');
  console.log('Collateral type:', isSOLCollateral ? 'SOL' : 'Token');
  
  // Create all required token accounts
  const lenderTokenAccount = createAssociatedTokenAccountPDA(lenderPublicKey, borrowedTokenMint);
  const borrowerTokenAccount = createAssociatedTokenAccountPDA(borrowerPublicKey, borrowedTokenMint);
  const collateralVaultTokenAccount = createCollateralVaultTokenAccountPDA(collateralVaultPda, collateralTokenMint);

  console.log('Loan Info PDA:', loanInfoPda.toString());
  console.log('Open Loan PDA:', openLoanPda.toString());
  console.log('Collateral Vault PDA:', collateralVaultPda.toString());
  console.log('Lender Token Account:', lenderTokenAccount.toString());
  console.log('Borrower Token Account:', borrowerTokenAccount.toString());
  console.log('Collateral Vault Token Account:', collateralVaultTokenAccount.toString());

  try {
    console.log('About to call payLoan instruction...');
    
    // Build accounts object - all accounts are required in new IDL
    const accounts: any = {
      openLoan: openLoanPda,
      loanInfo: loanInfoPda,
      collateralVault: collateralVaultPda,
      borrowerTokenAccount: borrowerTokenAccount,
      lenderTokenAccount: lenderTokenAccount,
      collateralVaultTokenAccount: collateralVaultTokenAccount,
      collateralTokenMint: collateralTokenMint,
      loanedTokenMint: borrowedTokenMint,
      borrower: borrowerPublicKey,
      lender: lenderPublicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      systemProgram: SystemProgram.programId,
    };

    console.log('Final accounts being sent to instruction:', JSON.stringify(accounts, null, 2));
    
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
