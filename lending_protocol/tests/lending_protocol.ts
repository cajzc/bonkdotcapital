import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { LendingProtocol } from "../target/types/lending_protocol";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";

// Helper function to load or create keypair from file
function loadOrCreateKeypair(filepath: string): Keypair {
  if (fs.existsSync(filepath)) {
    const secretKeyString = fs.readFileSync(filepath, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
  } else {
    const keypair = Keypair.generate();
    // ensure directory exists
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(Array.from(keypair.secretKey)));
    console.log(`Created new keypair and saved to ${filepath}`);
    return keypair;
  }
}

describe("lending_protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LendingProtocol as Program<LendingProtocol>;

  // Paths to wallet files
  const lenderPath = path.resolve(__dirname, "./wallets/lender.json");
  const borrowerPath = path.resolve(__dirname, "./wallets/borrower.json");

  it("should create a loan offer successfully", async () => {
    console.log("Starting: create a loan offer");

    const amount = new BN(1_000_000);
    const interestRateBps = 500;
    const durationSeconds = new BN(60 * 60 * 24 * 30); // 30 days
    const minScore = new BN(500);

    // Load or create lender keypair
    const lender = loadOrCreateKeypair(lenderPath);
    console.log("Loaded lender:", lender.publicKey.toBase58());

    console.log("Requesting airdrop for lender...");
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(lender.publicKey, 1_000_000_000),
      "confirmed"
    );
    console.log("Airdrop confirmed for lender");

    console.log("Creating mint...");
    const mint = await createMint(
      provider.connection,
      lender,
      lender.publicKey,
      null,
      6
    );
    console.log("Mint created:", mint.toBase58());

    console.log("Creating lender token account...");
    const lenderTokenAccount = await createAccount(
      provider.connection,
      lender,
      mint,
      lender.publicKey
    );
    console.log("Lender token account created:", lenderTokenAccount.toBase58());

    console.log("Minting tokens to lender...");
    await mintTo(
      provider.connection,
      lender,
      mint,
      lenderTokenAccount,
      lender,
      amount.toNumber()
    );
    console.log(`Minted ${amount.toString()} tokens to lender`);

    console.log("Deriving loan offer PDA...");
    const [loanOfferPda, loanOfferBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("loan_offer"),
        lender.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      program.programId
    );
    console.log("Loan Offer PDA:", loanOfferPda.toBase58(), "Bump:", loanOfferBump);

    console.log("Deriving vault PDA...");
    const [vaultPda, _vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), loanOfferPda.toBuffer()],
      program.programId
    );
    console.log("Vault PDA:", vaultPda.toBase58());

    console.log("Sending initializeCreateLoan transaction...");
    await program.methods
      .initializeCreateLoan(
        amount,
        interestRateBps,
        durationSeconds,
        minScore,
        loanOfferBump
      )
      .accounts({
        loanOffer: loanOfferPda,
        vault: vaultPda,
        lender: lender.publicKey,
        lenderTokenAccount,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([lender])
      .rpc();
    console.log("Loan offer created on chain");

    const loanOffer = await program.account.loanOffer.fetch(loanOfferPda);
    console.log("Fetched loan offer from chain:", loanOffer);

    assert.ok(loanOffer.isActive, "Loan offer should be active");
    assert.ok(loanOffer.amount.eq(amount));
    assert.equal(loanOffer.interestRateBps, interestRateBps);
    assert.equal(loanOffer.durationSeconds.toString(), durationSeconds.toString());
    assert.equal(loanOffer.minScore.toString(), minScore.toString());
    assert.equal(loanOffer.lender.toString(), lender.publicKey.toString());
    assert.equal(loanOffer.tokenMint.toString(), mint.toString());

    console.log("Loan offer validation completed");

    (global as any).testState = {
      lender,
      mint,
      loanOfferPda,
      loanOfferBump,
      vaultPda,
      lenderTokenAccount,
    };
  });

  it("should accept a loan successfully", async () => {
    console.log("Starting: accept loan");

    const {
      lender,
      mint,
      loanOfferPda,
      vaultPda,
      lenderTokenAccount,
    } = (global as any).testState;

    // Load or create borrower keypair
    const borrower = loadOrCreateKeypair(borrowerPath);
    console.log("Loaded borrower:", borrower.publicKey.toBase58());

    console.log("Requesting airdrop for borrower...");
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(borrower.publicKey, 1_000_000_000),
      "confirmed"
    );
    console.log("Airdrop confirmed for borrower");

    console.log("Creating borrower token account...");
    const borrowerTokenAccount = await createAccount(
      provider.connection,
      borrower,
      mint,
      borrower.publicKey
    );
    console.log("Borrower token account created:", borrowerTokenAccount.toBase58());

    console.log("Deriving loan PDA...");
    const [loanPda, loanBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("loan"),
        loanOfferPda.toBuffer(),
        borrower.publicKey.toBuffer(),
      ],
      program.programId
    );
    console.log("Loan PDA:", loanPda.toBase58(), "Bump:", loanBump);

    console.log("Sending intializeAcceptLoan transaction...");
    await program.methods
      .intializeAcceptLoan(loanBump)
      .accounts({
        loanOffer: loanOfferPda,
        loan: loanPda,
        borrowerTokenAccount: borrowerTokenAccount,
        vault: vaultPda,
        borrower: borrower.publicKey,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([borrower])
      .rpc();
    console.log("Loan accepted on chain");

    const loan = await program.account.loan.fetch(loanPda);
    const loanOffer = await program.account.loanOffer.fetch(loanOfferPda);

    console.log("Fetched loan:", loan);
    console.log("Fetched loan offer:", loanOffer);

    assert.equal(loanOffer.isActive, false, "Loan offer should be inactive after acceptance");

    assert.equal(loan.offer.toString(), loanOfferPda.toString());
    assert.equal(loan.borrower.toString(), borrower.publicKey.toString());
    assert.ok(loan.principal.eq(new BN(1_000_000)));
    assert.ok(loan.isRepaid === false);

    console.log("Loan acceptance validation completed");

    (global as any).testState = {
      ... (global as any).testState,
      borrower,
      borrowerTokenAccount,
      loanPda,
      loanBump,
    };
  });

  it("should repay a loan successfully", async () => {
    console.log("Starting: repay loan");

    const {
      lender,
      mint,
      loanOfferPda,
      vaultPda,
      lenderTokenAccount,
      borrower,
      borrowerTokenAccount,
      loanPda,
    } = (global as any).testState;

    console.log("Fetching loan offer account...");
    const loanOffer = await program.account.loanOffer.fetch(loanOfferPda);
    console.log("Loan offer fetched:", loanOffer);

    // Fetch loan before repayment to get principal
    const loanBeforePayment = await program.account.loan.fetch(loanPda);
    console.log("Loan before payment:", loanBeforePayment);

    // Mint tokens to borrower for repayment (principal + interest expected)
    // For testing, mint a bit more than principal to cover interest
    const repaymentAmount = 1_020_000; // approximate principal + interest
    console.log(`Minting ${repaymentAmount} tokens to borrower for repayment...`);
    await mintTo(
      provider.connection,
      lender,
      mint,
      borrowerTokenAccount,
      lender,
      repaymentAmount
    );
    console.log("Tokens minted to borrower");

    console.log("Sending initializePayLoan transaction...");
    await program.methods
      .initializePayLoan()
      .accounts({
        loanOffer: loanOfferPda,
        loan: loanPda,
        borrowerTokenAccount: borrowerTokenAccount,
        lenderTokenAccount: lenderTokenAccount,
        borrower: borrower.publicKey,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([borrower])
      .rpc();
    console.log("Loan repayment transaction confirmed");

    // Fetch loan account to verify repayment
    const loanAfterPayment = await program.account.loan.fetch(loanPda);
    console.log("Fetched loan after payment:", loanAfterPayment);

    assert.ok(loanAfterPayment.isRepaid, "Loan should be marked as repaid");

    // Calculate interest paid
    const principal = loanBeforePayment.principal.toNumber();
    // repaymentAmount is what borrower paid (principal + interest)
    const interestPaid = repaymentAmount - principal;

    console.log("====== LOAN REPAYMENT RECEIPT ======");
    console.log(`Loan principal amount: ${principal}`);
    console.log(`Total amount paid (principal + interest): ${repaymentAmount}`);
    console.log(`Interest paid: ${interestPaid}`);
    console.log("====================================");

    console.log("Loan repayment validation completed");
  });
});
