import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { APP_IDENTITY, useAuthorization } from "./AuthorizationProvider";
import { RPC_ENDPOINT, CLUSTER } from "../constants/RpcConnection";
import type { LendingProtocol } from "../idl/lending_protocol";
import idl from "../idl/lending_protocol.json";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";

// Simple wallet implementation for mobile wallet adapter
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
      publicKey: selectedAccount?.publicKey || null,
    };
  }, [selectedAccount]);

  // Create Anchor provider and program
  const provider = useMemo(() => {
    if (!connection || !wallet || !wallet.publicKey) return null;
    return new AnchorProvider(connection, wallet as any, {});
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    try {
      setProvider(provider);
      return new Program(idl as any, provider);
    } catch (error) {
      console.error('Error initializing Solana program:', error);
      return null;
    }
  }, [provider]);

  return {
    connection,
    wallet,
    program
  };
}