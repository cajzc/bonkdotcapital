global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';

// Types for loan operations
export interface LoanOfferData {
  tokenMint: string;
  lenderPublicKey: string;
  amount: string;
}

export interface PayLoanData {
  tokenMint: string;
  lenderPublicKey: string;
  borrowerPublicKey: string;
}

// Create loan offer operation
export async function createLoanOffer(
  program: any,
  connection: Connection,
  wallet: any,
  userPublicKey: PublicKey,
  selectedToken: { mint: string; balance: number },
  lendingAmount: string,
  selectedReceiveToken: string,
  interestRate: string,
  durationDays: string,
  minScore: string
): Promise<string> {
  const amount = parseFloat(lendingAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid amount');
  }

  const interestRateBps = parseFloat(interestRate);
  if (isNaN(interestRateBps) || interestRateBps <= 0) {
    throw new Error('Please enter a valid interest rate');
  }

  const duration = parseFloat(durationDays);
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Please enter a valid duration');
  }

  const minScoreValue = parseFloat(minScore);
  if (isNaN(minScoreValue) || minScoreValue < 0) {
    throw new Error('Please enter a valid minimum score');
  }

  // Find the token account for the selected token
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    userPublicKey,
    {
      mint: new PublicKey(selectedToken.mint)
    }
  );

  if (tokenAccounts.value.length === 0) {
    throw new Error('No token account found for the selected token');
  }

  const lenderTokenAccount = tokenAccounts.value[0].pubkey;
  console.log('Using token account:', lenderTokenAccount.toString());

  // Get the accepted token mint based on selection
  let acceptedTokenMint: PublicKey;
  if (selectedReceiveToken === 'SOL') {
    // Use wrapped SOL mint address
    acceptedTokenMint = new PublicKey('So11111111111111111111111111111111111111112');
  } else if (selectedReceiveToken === 'BONK') {
    // Use BONK mint address
    acceptedTokenMint = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
  } else {
    throw new Error('Invalid selected receive token');
  }

  // Create PDA for the loan info
  const [loanInfoPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan_info'),
      userPublicKey.toBuffer(),
      new PublicKey(selectedToken.mint).toBuffer(),
    ],
    program.programId
  );

  // Create PDA for the vault
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      loanInfoPda.toBuffer(),
    ],
    program.programId
  );

  // Create the instruction
  const durationSeconds = Math.floor(duration * 24 * 60 * 60);
  
  console.log('Loan Info PDA:', loanInfoPda.toString());
  console.log('Vault PDA:', vaultPda.toString());
  console.log('Lender:', userPublicKey.toString());
  console.log('Loan Token Mint:', selectedToken.mint);
  console.log('Accepted Token Mint:', acceptedTokenMint.toString());
  console.log('Amount:', amount * Math.pow(10, 6));
  console.log('Interest Rate BPS:', Math.round(interestRateBps * 100));
  console.log('Duration Seconds:', durationSeconds);
  console.log('Min Score:', minScoreValue);
  
  try {
    const tx = await program.methods
      .createLoan(
        new BN(amount * Math.pow(10, 6)), // amount
        Math.round(interestRateBps * 100), // interest_rate_bps (convert percentage to basis points)
        new BN(durationSeconds), // duration_seconds (convert days to seconds)
        new BN(minScoreValue) // min_score
      )
      .accounts({
        loanInfo: loanInfoPda,
        vault: vaultPda,
        lender: userPublicKey,
        lenderTokenAccount: lenderTokenAccount,
        loanTokenMint: new PublicKey(selectedToken.mint),
        acceptedTokenMint: acceptedTokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('Transaction successful:', tx);
    return tx;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// Accept loan operation
export async function acceptLoan(
  program: Program<any>,
  connection: Connection,
  wallet: any,
  borrowerPublicKey: PublicKey,
  loanOfferData: LoanOfferData
): Promise<string> {
  const tokenMint = new PublicKey(loanOfferData.tokenMint);
  const lenderPublicKey = new PublicKey(loanOfferData.lenderPublicKey);

  // Find PDA for loan info
  const [loanInfoPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan_info'),
      lenderPublicKey.toBuffer(),
      tokenMint.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for open loan
  const [openLoanPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('open_loan'),
      loanInfoPda.toBuffer(),
      borrowerPublicKey.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for collateral vault
  const [collateralVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('collateral_vault'),
      loanInfoPda.toBuffer(),
      borrowerPublicKey.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for vault
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      loanInfoPda.toBuffer(),
    ],
    program.programId
  );

  // Find the borrower's token account for the mint
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    borrowerPublicKey,
    {
      mint: tokenMint
    }
  );

  if (tokenAccounts.value.length === 0) {
    throw new Error('No token account found for the selected token');
  }

  const borrowerTokenAccount = tokenAccounts.value[0].pubkey;
  console.log('Using borrower token account:', borrowerTokenAccount.toString());

  // Create the instruction
  const instruction = await program.methods
    .takeLoan(
      new BN(parseFloat(loanOfferData.amount) * Math.pow(10, 6)) // amount
    )
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

// Pay loan operation
export async function payLoan(
  program: Program<any>,
  connection: Connection,
  wallet: any,
  borrowerPublicKey: PublicKey,
  payLoanData: PayLoanData
): Promise<string> {
  const tokenMint = new PublicKey(payLoanData.tokenMint);
  const lenderPublicKey = new PublicKey(payLoanData.lenderPublicKey);

  // Find PDA for loan info
  const [loanInfoPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan_info'),
      lenderPublicKey.toBuffer(),
      tokenMint.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for open loan
  const [openLoanPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('open_loan'),
      loanInfoPda.toBuffer(),
      borrowerPublicKey.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for collateral vault
  const [collateralVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('collateral_vault'),
      loanInfoPda.toBuffer(),
      borrowerPublicKey.toBuffer(),
    ],
    program.programId
  );

  // Find the borrower's token account for the mint
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    borrowerPublicKey,
    {
      mint: tokenMint
    }
  );

  if (tokenAccounts.value.length === 0) {
    throw new Error('No token account found for the selected token');
  }

  const borrowerTokenAccount = tokenAccounts.value[0].pubkey;

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

  // Create the instruction
  const instruction = await program.methods
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