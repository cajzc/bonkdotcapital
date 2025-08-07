global.Buffer = require('buffer').Buffer;

import { PublicKey } from "@solana/web3.js";

export function createLoanInfoPDA(lender: PublicKey, tokenMint: PublicKey, programId: PublicKey): PublicKey {
    const [loanInfoPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('loan_info'), lender.toBuffer(), tokenMint.toBuffer()],
        programId
    );
    return loanInfoPda;
}

export function createOpenLoanPDA(loanInfoPda: PublicKey, borrower: PublicKey, programId: PublicKey): PublicKey {
    const [openLoanPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('open_loan'), loanInfoPda.toBuffer(), borrower.toBuffer()],
        programId
    );
    return openLoanPda;
}

export function createVaultPDA(loanInfoPda: PublicKey, programId: PublicKey): PublicKey {
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), loanInfoPda.toBuffer()],
        programId
    );
    return vaultPda;
}

export function createCollateralVaultPDA(loanInfoPda: PublicKey, borrower: PublicKey, programId: PublicKey): PublicKey {
    const [collateralVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('collateral_vault'), loanInfoPda.toBuffer(), borrower.toBuffer()],
        programId
    );
    return collateralVaultPda;
}