global.Buffer = require('buffer').Buffer;

import { PublicKey } from "@solana/web3.js";

export function createLoanOfferPDA(lender: PublicKey, tokenMint: PublicKey, programId: PublicKey): PublicKey {
    const [loanOfferPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan_offer'), lender.toBuffer(), tokenMint.toBuffer()],
        programId
    );
    return loanOfferPda;
}

export function createLoanPDA(borrower: PublicKey, loanOfferPda: PublicKey, programId: PublicKey): PublicKey {
    const [loanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan'), loanOfferPda.toBuffer(), borrower.toBuffer()],
        programId
    );
    return loanPda;
}

export function createVaultPDA(loanOfferPda: PublicKey, programId: PublicKey): PublicKey {
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), loanOfferPda.toBuffer()],
        programId
    );
    return vaultPda;
}

export function createObligationPDA(borrower: PublicKey, programId: PublicKey): PublicKey {
    const [obligationPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('obligation'), borrower.toBuffer()],
        programId
    );
    return obligationPda;
}