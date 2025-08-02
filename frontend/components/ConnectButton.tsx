import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, { ComponentProps, useCallback, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius } from '../constants';
import { useAuthorization } from '../lib/AuthorizationProvider';

type Props = Readonly<ComponentProps<typeof TouchableOpacity>>;

export default function ConnectButton(props: Props) {
  const {authorizeSession, selectedAccount} = useAuthorization();
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  
  const isConnected = selectedAccount !== null;
  
  const handleConnectPress = useCallback(async () => {
    if (isConnected) {
      // Already connected, could add disconnect logic here
      return;
    }
    
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await transact(async wallet => {
        await authorizeSession(wallet);
      });
    } catch (err: any) {
      console.log(
        'Error during connect',
        err instanceof Error ? err.message : err,
      );
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress, authorizeSession, isConnected]);
  
  return (
    <TouchableOpacity 
      {...props}
      style={[
        styles.connectButton,
        isConnected && styles.connectedButton,
        props.style
      ]}
      disabled={authorizationInProgress}
      onPress={handleConnectPress}
    >
      <Text style={[
        styles.connectText,
        isConnected && styles.connectedText
      ]}>
        {isConnected ? 'Connected' : 'Connect'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.xxl,
    gap: 6,
    ...Shadows.primary,
  },
  connectedButton: {
    backgroundColor: Colors.success,
  },
  connectText: {
    color: Colors.textLight,
    fontWeight: FontWeight.semibold,
    fontSize: Typography.sm,
  },
  connectedText: {
    color: Colors.textLight,
  },
});