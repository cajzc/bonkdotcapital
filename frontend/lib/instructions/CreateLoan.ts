global.Buffer = require('buffer').Buffer;

import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { apiClient } from '../apiClient';

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
  minScore: string,
  collateralAmount: string
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

  const collateralAmountValue = parseFloat(collateralAmount);
  if (isNaN(collateralAmountValue) || collateralAmountValue <= 0) {
    throw new Error('Please enter a valid collateral amount');
  }

  // Determine collateral token decimals based on selected token
  let collateralDecimals: number;
  if (selectedReceiveToken === 'SOL') {
    collateralDecimals = 9; // SOL has 9 decimal places
  } else if (selectedReceiveToken === 'BONK') {
    collateralDecimals = 5; // BONK has 5 decimal places
  } else {
    // For other tokens, assume 6 decimals (common default)
    collateralDecimals = 6;
    console.warn(`Unknown token ${selectedReceiveToken}, assuming 6 decimals`);
  }

  // Find the token account for the selected token
  console.log('Looking for token accounts for mint:', selectedToken.mint);
  console.log('User public key:', userPublicKey.toString());
  
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    userPublicKey,
    {
      mint: new PublicKey(selectedToken.mint)
    }
  );

  console.log('Found token accounts:', tokenAccounts.value.length);
  if (tokenAccounts.value.length === 0) {
    throw new Error(`No token account found for the selected token ${selectedToken.mint}. Make sure you have this token in your wallet.`);
  }

  const lenderTokenAccount = tokenAccounts.value[0].pubkey;
  console.log('Using token account:', lenderTokenAccount.toString());
  
  // Check token account balance
  try {
    const balance = await connection.getTokenAccountBalance(lenderTokenAccount);
    console.log('Token account balance:', balance.value.uiAmount, balance.value.amount);
    
    const requiredAmount = amount * Math.pow(10, loanDecimals);
    console.log('Required amount (raw):', requiredAmount);
    console.log('Available amount (raw):', balance.value.amount);
    
    if (parseInt(balance.value.amount) < requiredAmount) {
      throw new Error(`Insufficient token balance. You have ${balance.value.uiAmount} but need ${amount}`);
    }
  } catch (balanceError) {
    console.warn('Could not check token balance:', balanceError);
  }

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
  
  // Validate all the key components before creating transaction
  console.log('=== TRANSACTION VALIDATION ===');
  console.log('Loan Info PDA:', loanInfoPda.toString());
  console.log('Vault PDA:', vaultPda.toString());
  console.log('Lender:', userPublicKey.toString());
  console.log('Lender Token Account:', lenderTokenAccount.toString());
  console.log('Loan Token Mint:', selectedToken.mint);
  console.log('Accepted Token Mint:', acceptedTokenMint.toString());
  console.log('Program ID:', program.programId.toString());
  
  // Validate inputs are reasonable
  if (amount <= 0) throw new Error('Amount must be positive');
  if (collateralAmountValue <= 0) throw new Error('Collateral amount must be positive');
  if (interestRateBps <= 0) throw new Error('Interest rate must be positive');
  if (durationSeconds <= 0) throw new Error('Duration must be positive');
  
  console.log('All validations passed');
  
  try {
    // Get loan token decimals (the token being lent out)
    let loanDecimals: number;
    const selectedTokenMint = selectedToken.mint.toString();
    if (selectedTokenMint === 'So11111111111111111111111111111111111111112') {
      loanDecimals = 9; // SOL
    } else if (selectedTokenMint === 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263') {
      loanDecimals = 5; // BONK
    } else {
      loanDecimals = 6; // Default for most SPL tokens
    }

    console.log('About to call createLoan with parameters:');
    console.log('- loan_amount:', amount * Math.pow(10, loanDecimals));
    console.log('- collateral_amount:', collateralAmountValue * Math.pow(10, collateralDecimals));
    console.log('- interest_rate_bps:', Math.round(interestRateBps * 100));
    console.log('- duration_seconds:', durationSeconds);
    console.log('- min_score:', minScoreValue);
    console.log('- loan_decimals:', loanDecimals);
    console.log('- collateral_decimals:', collateralDecimals);
    
          const tx = await program.methods
        .createLoan(
          new BN(amount * Math.pow(10, loanDecimals)), // loan_amount with correct decimals
          new BN(collateralAmountValue * Math.pow(10, collateralDecimals)), // collateral_amount with correct decimals
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
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Check if it's a wallet authorization error
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message as string;
      console.error('Error message:', errorMessage);
      
      if (errorMessage.includes('authorization') || errorMessage.includes('SolanaMobileWalletAdapterProtocolError')) {
        throw new Error('Wallet authorization failed. Please try connecting your wallet again.');
      }
      if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient funds to complete this transaction.');
      }
      if (errorMessage.includes('Transaction simulation failed') || errorMessage.includes('simulation failed')) {
        throw new Error('Transaction validation failed. Check that you have enough tokens and valid inputs.');
      }
      if (errorMessage.includes('custom program error')) {
        throw new Error(`Smart contract error: ${errorMessage}. Please check your token balances and try again.`);
      }
      if (errorMessage.includes('account not found') || errorMessage.includes('AccountNotInitialized')) {
        throw new Error('Token account not found. Make sure you have the selected token in your wallet.');
      }
    }
    
    throw error;
  }
}

// Accept loan operation
export async function acceptLoan(
  program: Program<any>,
  connection: Connection,
  wallet: any,
  borrowerPublicKey: PublicKey,
  loanOfferData: LoanOfferData,
  offerId?: string, // Optional offer ID for backend update
  offerDuration?: number // Optional offer duration in days
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
        console.warn('Loan was accepted successfully on-chain, but backend update failed.');
      }
      
      // Don't throw here - the blockchain transaction was successful
    }
  }
  
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