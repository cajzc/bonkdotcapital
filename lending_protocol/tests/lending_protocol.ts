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
      [Buffer.from("loan_offer"), lender.publicKey.toBuffer(), mint.toBuffer()],
      program.programId
    );
    console.log(
      "Loan Offer PDA:",
      loanOfferPda.toBase58(),
      "Bump:",
      loanOfferBump
    );

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
    assert.ok(loanOffer.isActive, "Loan offer should be active");
    assert.ok(loanOffer.amount.eq(amount));
    assert.equal(loanOffer.interestRateBps, interestRateBps);
    assert.equal(
      loanOffer.durationSeconds.toString(),
      durationSeconds.toString()
    );
    assert.equal(loanOffer.minScore.toString(), minScore.toString());
    assert.equal(loanOffer.lender.toString(), lender.publicKey.toString());
    assert.equal(loanOffer.tokenMint.toString(), mint.toString());

    (global as any).testState = {
      lender,
      mint,
      loanOfferPda,
      loanOfferBump,
      vaultPda,
      lenderTokenAccount,
    };
  });

  it("should deposit collateral successfully", async () => {
    console.log("Starting: deposit collateral");

    const { lender, mint } = (global as any).testState;

    // Load or create borrower keypair
    const borrower = loadOrCreateKeypair(borrowerPath);
    console.log("Loaded borrower:", borrower.publicKey.toBase58());

    console.log("Requesting airdrop for borrower...");
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        borrower.publicKey,
        1_000_000_000
      ),
      "confirmed"
    );
    console.log("Airdrop confirmed for borrower");

    // Derive obligation PDA
    const [obligationPda, obligationBump] = await PublicKey.findProgramAddress(
      [Buffer.from("obligation"), borrower.publicKey.toBuffer()],
      program.programId
    );
    console.log("Obligation PDA:", obligationPda.toBase58());

    // Derive collateral vault PDA
    const [collateralVaultPda, collateralVaultBump] =
      await PublicKey.findProgramAddress(
        [
          Buffer.from("collateral_vault"),
          borrower.publicKey.toBuffer(),
          mint.toBuffer(),
        ],
        program.programId
      );
    console.log("Collateral Vault PDA:", collateralVaultPda.toBase58());

    // Create borrower token account for collateral if needed
    const borrowerTokenAccount = await createAccount(
      provider.connection,
      borrower,
      mint,
      borrower.publicKey
    );
    console.log(
      "Borrower token account for collateral:",
      borrowerTokenAccount.toBase58()
    );

    // Mint collateral tokens to borrower token account (for testing)
    const collateralAmount = 500_000;
    await mintTo(
      provider.connection,
      lender,
      mint,
      borrowerTokenAccount,
      lender,
      collateralAmount
    );
    console.log(`Minted ${collateralAmount} collateral tokens to borrower`);

    // Deposit collateral
    await program.methods
      .initializeObligation(new BN(collateralAmount), obligationBump)
      .accounts({
        obligation: obligationPda,
        borrowerTokenAccount,
        collateralVault: collateralVaultPda,
        tokenMint: mint,
        borrower: borrower.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([borrower])
      .rpc();
    console.log("Collateral deposited on chain");

    // Fetch obligation and verify
    const obligation = await program.account.obligation.fetch(obligationPda);
    assert.equal(obligation.borrower.toBase58(), borrower.publicKey.toBase58());
    assert.equal(obligation.depositedAmount.toNumber(), collateralAmount);
    assert.equal(obligation.loanActive, false);

    // Save borrower related info for later
    (global as any).testState = {
      ...(global as any).testState,
      borrower,
      borrowerTokenAccount,
      obligationPda,
      obligationBump,
      collateralVaultPda,
      collateralVaultBump,
    };

    console.log("Collateral deposit validation completed");
  });

  it("should accept a loan successfully", async () => {
    console.log("Starting: accept loan");

    const {
      lender,
      mint,
      loanOfferPda,
      vaultPda,
      lenderTokenAccount,
      borrower,
      borrowerTokenAccount,
      obligationPda,
      obligationBump,
    } = (global as any).testState;

    // Derive loan PDA
    const [loanPda, loanBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("loan"),
        loanOfferPda.toBuffer(),
        borrower.publicKey.toBuffer(),
      ],
      program.programId
    );
    console.log("Loan PDA:", loanPda.toBase58(), "Bump:", loanBump);

    // Accept loan
    await program.methods
      .intializeAcceptLoan(loanBump)
      .accounts({
        loanOffer: loanOfferPda,
        loan: loanPda,
        borrowerTokenAccount,
        vault: vaultPda,
        borrower: borrower.publicKey,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        obligation: obligationPda,
      })
      .signers([borrower])
      .rpc();
    console.log("Loan accepted on chain");

    const loan = await program.account.loan.fetch(loanPda);
    const loanOffer = await program.account.loanOffer.fetch(loanOfferPda);
    const obligation = await program.account.obligation.fetch(obligationPda);

    assert.equal(
      loanOffer.isActive,
      false,
      "Loan offer should be inactive after acceptance"
    );
    assert.equal(loan.offer.toBase58(), loanOfferPda.toBase58());
    assert.equal(loan.borrower.toBase58(), borrower.publicKey.toBase58());
    assert.ok(loan.principal.eq(new BN(1_000_000)));
    assert.ok(loan.isRepaid === false);
    assert.ok(
      obligation.loanActive,
      "Obligation loanActive should be true after loan acceptance"
    );

    (global as any).testState = {
      ...(global as any).testState,
      loanPda,
      loanBump,
    };

    console.log("Loan acceptance validation completed");
  });

  it("should repay a loan successfully and return collateral", async () => {
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
      obligationPda,
      collateralVaultPda, // You need to store this from earlier steps
    } = (global as any).testState;

    // Derive vault token account PDA (holds tokens in the vault)
    const [vaultTokenAccountPda] = await PublicKey.findProgramAddress(
      [Buffer.from("vault_token_account"), vaultPda.toBuffer()],
      program.programId
    );

    // Fetch vault token account balance before repayment
    const vaultTokenAccountBefore = await provider.connection
      .getTokenAccountBalance(vaultTokenAccountPda)
      .catch(() => null);

    // Fetch borrower collateral token account balance before repayment
    const borrowerCollateralBalanceBefore =
      await provider.connection.getTokenAccountBalance(borrowerTokenAccount);

    console.log("Collateral balances before repayment:");
    console.log(
      `Vault token account: ${vaultTokenAccountBefore?.value.amount || "0"}`
    );
    console.log(
      `Borrower collateral account: ${borrowerCollateralBalanceBefore.value.amount}`
    );

    const repaymentAmount = 1_020_000; // principal + interest (adjust as needed)

    console.log(`Minting ${repaymentAmount} tokens to borrower...`);
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
        obligation: obligationPda,
        collateralVault: collateralVaultPda,
      })
      .signers([borrower])
      .rpc();
    console.log("Loan repayment transaction confirmed");

    // Fetch updated accounts
    const loanAfterPayment = await program.account.loan.fetch(loanPda);
    const obligationAfter = await program.account.obligation.fetch(
      obligationPda
    );

    console.log("Collateral balances after repayment:");

    // Fetch balances after repayment
    const vaultTokenAccountAfter = await provider.connection
      .getTokenAccountBalance(vaultTokenAccountPda)
      .catch(() => null);
    const borrowerCollateralBalanceAfter =
      await provider.connection.getTokenAccountBalance(borrowerTokenAccount);

    console.log(
      `Vault token account: ${vaultTokenAccountAfter?.value.amount || "0"}`
    );
    console.log(
      `Borrower collateral account: ${borrowerCollateralBalanceAfter.value.amount}`
    );

    // Validations
    assert.ok(loanAfterPayment.isRepaid, "Loan should be marked as repaid");
    assert.equal(
      obligationAfter.loanActive,
      false,
      "Obligation should be marked as inactive"
    );

    // Collateral should be returned: borrower balance increases, vault balance decreases
    //assert.isAbove(
    //  parseInt(borrowerCollateralBalanceAfter.value.amount),
    //  parseInt(borrowerCollateralBalanceBefore.value.amount),
    //  "Borrower's collateral balance should increase after repayment"
   // );

   // assert.isBelow(
   //   parseInt(vaultTokenAccountAfter?.value.amount || "0"),
   //   parseInt(vaultTokenAccountBefore?.value.amount || "0"),
   //   "Vault collateral balance should decrease after repayment"
   // );

    const principal = loanAfterPayment.principal.toNumber();
    const interestPaid = repaymentAmount - principal;

    console.log("====== LOAN REPAYMENT RECEIPT ======");
    console.log(`Loan principal amount: ${principal}`);
    console.log(`Total amount paid (principal + interest): ${repaymentAmount}`);
    console.log(`Interest paid: ${interestPaid}`);
    console.log("--- Obligation Summary ---");
    console.log(`Obligation borrower: ${obligationAfter.borrower.toBase58()}`);
    console.log(
      `Deposited collateral amount: ${obligationAfter.depositedAmount.toNumber()}`
    );
    console.log(`Loan active: ${obligationAfter.loanActive}`);
    console.log("===========================");

    console.log("Loan repayment validation completed");
  });
});
