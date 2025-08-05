import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_CLOCK_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { BN } from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
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
  program: Program<any>,
  connection: Connection,
  wallet: any,
  userPublicKey: PublicKey,
  selectedToken: { mint: string; balance: number },
  lendingAmount: string,
  selectedReceiveToken: string
): Promise<string> {
  const amount = parseFloat(lendingAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid amount');
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

  // Create PDA for the loan offer
  const [loanOfferPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan_offer'),
      userPublicKey.toBuffer(),
      new PublicKey(selectedToken.mint).toBuffer(),
    ],
    program.programId
  );

  // Create PDA for the vault
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      loanOfferPda.toBuffer(),
    ],
    program.programId
  );

  // Create the instruction
  const instruction = await program.methods
    .initializeCreateLoan(
      new BN(amount * Math.pow(10, 6)), // amount
      500, // interest_rate_bps (5% = 500 basis points)
      new BN(1000), // duration_slots
      new BN(0), // min_score
      0 // bump (Anchor will handle this)
    )
    .accounts({
      loanOffer: loanOfferPda,
      vault: vaultPda,
      lender: userPublicKey,
      lenderTokenAccount: lenderTokenAccount,
      tokenMint: new PublicKey(selectedToken.mint),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  // Create and send transaction
  const transaction = new Transaction();
  transaction.add(instruction);

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = userPublicKey;

  // Sign and send transaction using the wallet
  const signedTransaction = await wallet?.signTransaction(transaction);
  if (!signedTransaction) {
    throw new Error('Failed to sign transaction');
  }

  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(signature);
  
  return signature;
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

  // Find PDA for loan offer
  const [loanOfferPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan_offer'),
      lenderPublicKey.toBuffer(),
      tokenMint.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for loan
  const [loanPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan'),
      loanOfferPda.toBuffer(),
      borrowerPublicKey.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for vault
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('vault'),
      loanOfferPda.toBuffer(),
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

  // Find PDA for loan offer
  const [loanOfferPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan_offer'),
      lenderPublicKey.toBuffer(),
      tokenMint.toBuffer(),
    ],
    program.programId
  );

  // Find PDA for loan
  const [loanPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('loan'),
      loanOfferPda.toBuffer(),
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
    .initializePayLoan()
    .accounts({
      loan: loanPda,
      loanOffer: loanOfferPda,
      borrowerTokenAccount: borrowerTokenAccount,
      lenderTokenAccount: lenderTokenAccount,
      borrower: borrowerPublicKey,
      tokenMint: tokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
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