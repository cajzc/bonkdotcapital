import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { Connection, PublicKey } from '@solana/web3.js';

export interface TokenInfo {
  mint: string;
  balance: number;
}

export async function getUserTokenAccounts(connection: Connection, userPublicKey: string): Promise<TokenInfo[]> {
  try {
    console.log('Fetching tokens for user:', userPublicKey);
    
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      new PublicKey(userPublicKey),
      {
        programId: TOKEN_PROGRAM_ID 
      }
    );

    const tokenInfos: TokenInfo[] = [];
    
    for (const accountInfo of tokenAccounts.value) {
      try {
        const parsedAccount = await connection.getParsedAccountInfo(accountInfo.pubkey);
        if (parsedAccount.value && parsedAccount.value.data && 'parsed' in parsedAccount.value.data) {
          const parsedData = parsedAccount.value.data.parsed as any;
          if (parsedData.info && parsedData.info.tokenAmount) {
            tokenInfos.push({
              mint: parsedData.info.mint,
              balance: Number(parsedData.info.tokenAmount.uiAmount || 0),
            });
          }
        }
      } catch (err) {
        console.log('Error parsing account:', err);
        continue;
      }
    }

    console.log('Found token accounts:', tokenInfos);
    return tokenInfos;

  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
}

// Common token symbols for known mints
const TOKEN_SYMBOLS: { [key: string]: string } = {
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC',
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
};

export function getTokenSymbol(mintAddress: string): string {
  return TOKEN_SYMBOLS[mintAddress] || mintAddress.slice(0, 4) + '...';
}
