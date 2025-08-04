import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface TokenAccount {
  pubkey: PublicKey;
  account: any;
  info: {
    mint: PublicKey;
    owner: PublicKey;
    amount: string;
    delegate: PublicKey | null;
    state: number;
    isNative: boolean;
    delegatedAmount: string;
    closeAuthority: PublicKey | null;
  };
}

export interface TokenInfo {
  mint: PublicKey;
  symbol?: string;
  name?: string;
  decimals: number;
  balance: number;
  tokenAccount: PublicKey;
}

export async function getUserTokenAccounts(
  connection: Connection,
  userPublicKey: PublicKey
): Promise<TokenInfo[]> {
  try {
    console.log('Fetching tokens for user:', userPublicKey.toString());
    
    // Get all token accounts owned by the user
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      userPublicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    console.log('Found token accounts:', tokenAccounts.value.length);

    const tokenInfos: TokenInfo[] = [];

    for (const tokenAccount of tokenAccounts.value) {
      try {
        const accountInfo = await connection.getParsedAccountInfo(tokenAccount.pubkey);
        
        if (accountInfo.value && 'parsed' in accountInfo.value) {
          const parsedInfo = accountInfo.value.parsed as any;
          
          console.log('Token account info:', {
            mint: parsedInfo.info.mint,
            amount: parsedInfo.info.tokenAmount.amount,
            decimals: parsedInfo.info.tokenAmount.decimals,
            state: parsedInfo.info.state
          });
          
          // Include accounts with non-zero balance and active state
          if (parseInt(parsedInfo.info.tokenAmount.amount) > 0 && parsedInfo.info.state === 1) {
            const balance = parseInt(parsedInfo.info.tokenAmount.amount) / Math.pow(10, parsedInfo.info.tokenAmount.decimals);
            
            tokenInfos.push({
              mint: new PublicKey(parsedInfo.info.mint),
              decimals: parsedInfo.info.tokenAmount.decimals,
              balance: balance,
              tokenAccount: tokenAccount.pubkey,
            });
            
            console.log('Added token:', {
              mint: parsedInfo.info.mint,
              balance: balance,
              symbol: getTokenSymbol(parsedInfo.info.mint)
            });
          } else {
            console.log('Token filtered out:', {
              mint: parsedInfo.info.mint,
              amount: parsedInfo.info.tokenAmount.amount,
              state: parsedInfo.info.state,
              reason: parseInt(parsedInfo.info.tokenAmount.amount) > 0 ? 'state not active' : 'zero balance'
            });
          }
        } else {
          console.log('Account info not parsed or missing:', {
            account: tokenAccount.pubkey.toString(),
            hasValue: !!accountInfo.value,
            hasParsed: accountInfo.value && 'parsed' in accountInfo.value
          });
        }
      } catch (error) {
        console.error('Error processing token account:', tokenAccount.pubkey.toString(), error);
      }
    }

    console.log('Final token count:', tokenInfos.length);
    return tokenInfos;
  } catch (error) {
    console.error('Error fetching user token accounts:', error);
    return [];
  }
}

// Common token mints for reference
export const COMMON_TOKENS = {
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
};

// Devnet token mints
export const DEVNET_TOKENS = {
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Same as mainnet for now
  USDC: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Same as mainnet
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
};

export function getTokenSymbol(mintAddress: string): string {
  switch (mintAddress) {
    case COMMON_TOKENS.BONK:
    case DEVNET_TOKENS.BONK:
      return 'BONK';
    case COMMON_TOKENS.USDC:
    case DEVNET_TOKENS.USDC:
      return 'USDC';
    case COMMON_TOKENS.USDT:
    case DEVNET_TOKENS.USDT:
      return 'USDT';
    case COMMON_TOKENS.SOL:
    case DEVNET_TOKENS.SOL:
      return 'SOL';
    default:
      return mintAddress.slice(0, 4) + '...';
  }
}

// Function to create mock tokens for testing (when no real tokens are found)
export function createMockTokens(userPublicKey: PublicKey): TokenInfo[] {
  return [
    {
      mint: new PublicKey(DEVNET_TOKENS.BONK),
      decimals: 5,
      balance: 1000000, // 1M BONK
      tokenAccount: new PublicKey('11111111111111111111111111111111'), // Mock account
      symbol: 'BONK'
    },
    {
      mint: new PublicKey(DEVNET_TOKENS.USDC),
      decimals: 6,
      balance: 1000, // 1000 USDC
      tokenAccount: new PublicKey('11111111111111111111111111111112'), // Mock account
      symbol: 'USDC'
    }
  ];
} 