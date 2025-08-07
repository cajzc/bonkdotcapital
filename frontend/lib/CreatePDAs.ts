global.Buffer = require('buffer').Buffer;

import { PublicKey } from "@solana/web3.js";

export function createLoanInfoPDA(lender: PublicKey, tokenMint: PublicKey, programId: PublicKey): PublicKey {
    console.log('Creating loan info PDA for lender:', lender.toString(), 'and token mint:', tokenMint.toString());
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

export function createAssociatedTokenAccountPDA(owner: PublicKey, tokenMint: PublicKey): PublicKey {
    const [associatedTokenAccount] = PublicKey.findProgramAddressSync(
        [
            owner.toBuffer(),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(), // TOKEN_PROGRAM_ID
            tokenMint.toBuffer(),
        ],
        new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return associatedTokenAccount;
}

export function createCollateralVaultTokenAccountPDA(collateralVault: PublicKey, tokenMint: PublicKey): PublicKey {
    const [collateralVaultTokenAccount] = PublicKey.findProgramAddressSync(
        [
            collateralVault.toBuffer(),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(), // TOKEN_PROGRAM_ID
            tokenMint.toBuffer(),
        ],
        new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return collateralVaultTokenAccount;
}
