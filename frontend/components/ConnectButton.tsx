import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import React, { ComponentProps, useCallback, useState } from 'react';
import { Button } from 'react-native';

import { useAuthorization } from '../lib/AuthorizationProvider';

type Props = Readonly<ComponentProps<typeof Button>>;

export default function ConnectButton(props: Props) {
  const {authorizeSession} = useAuthorization();
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const handleConnectPress = useCallback(async () => {
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
  }, [authorizationInProgress, authorizeSession]);
  return (
    <Button
      {...props}
      disabled={authorizationInProgress}
      onPress={handleConnectPress}
    />
  );
}