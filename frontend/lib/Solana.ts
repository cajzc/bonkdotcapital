import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { APP_IDENTITY, useAuthorization } from "./AuthorizationProvider";
import { RPC_ENDPOINT, CLUSTER } from "../constants/RpcConnection";

// Simple wallet implementation without Anchor dependencies
export function useSolanaProgram() {
  const { selectedAccount } = useAuthorization();
  
  // Create connection directly
  const connection = useMemo(() => {
    return new Connection(RPC_ENDPOINT, 'confirmed');
  }, []);
  
  const wallet = useMemo(() => {
    return {
      signTransaction: async (transaction: Transaction) => {
        return transact(async (wallet: Web3MobileWallet) => {
          const authorizationResult = await wallet.authorize({
            cluster: CLUSTER,
            identity: APP_IDENTITY,
          });

          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });
          return signedTransactions[0];
        });
      },
      signAllTransactions: async (transactions: Transaction[]) => {
        return transact(async (wallet: Web3MobileWallet) => {
          const authorizationResult = await wallet.authorize({
            cluster: CLUSTER,
            identity: APP_IDENTITY,
          });

          const signedTransactions = await wallet.signTransactions({
            transactions: transactions,
          });
          return signedTransactions;
        });
      },
      get publicKey() {
        return selectedAccount?.publicKey || null;
      },
    };
  }, [selectedAccount]);

  return { 
    connection, 
    wallet,
    // Return null for program since we're not using Anchor for now
    program: null 
  };
}

