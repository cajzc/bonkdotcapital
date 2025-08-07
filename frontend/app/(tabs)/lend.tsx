global.Buffer = require('buffer').Buffer;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSolanaProgram } from '../../lib/Solana';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { getUserTokenAccounts, TokenInfo, getTokenSymbol } from '../../lib/tokenUtils';
import { RPC_ENDPOINT } from '@/constants/RpcConnection';
import { createLoanOffer } from '../../lib/instructions/CreateLoan';
import { Connection, PublicKey } from '@solana/web3.js';
import { apiClient } from '../../lib/apiClient';
import { createLoanInfoPDA } from '../../lib/CreatePDAs';

export default function LendScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAuthorization();
  const { program, wallet } = useSolanaProgram();
  const [lendingAmount, setLendingAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [hasLoadedTokens, setHasLoadedTokens] = useState(false);
  const [selectedReceiveToken, setSelectedReceiveToken] = useState<'SOL' | 'BONK' | null>(null);
  const [interestRate, setInterestRate] = useState('5'); // Default 5%
  const [durationDays, setDurationDays] = useState('30'); // Default 30 days
  const [minScore, setMinScore] = useState('0'); // Default 0
  const [collateralAmount, setCollateralAmount] = useState(''); // New field for collateral amount

  // Create connection once, not on every render
  const connection = React.useMemo(() => new Connection(RPC_ENDPOINT), []);

  useEffect(() => {
    console.log('useEffect triggered:', { 
      hasConnection: !!connection, 
      hasSelectedAccount: !!selectedAccount,
      publicKey: selectedAccount?.publicKey?.toString(),
      hasLoadedTokens
    });
    
    if (connection && selectedAccount?.publicKey && !hasLoadedTokens) {
      console.log('Calling loadUserTokens...');
      loadUserTokens();
    }
  }, [connection, selectedAccount]);

  const loadUserTokens = async () => {
    console.log('loadUserTokens called');
    console.log('Debug info:', {
      hasConnection: !!connection,
      hasSelectedAccount: !!selectedAccount,
      publicKey: selectedAccount?.publicKey?.toString(),
      hasLoadedTokens,
      userTokensLength: userTokens.length
    });
    
    if (!connection || !selectedAccount?.publicKey) {
      console.log('Missing connection or selectedAccount');
      return;
    }
    
    console.log('Starting token fetch for:', selectedAccount.publicKey.toString());
    setIsLoadingTokens(true);
    try {
      const tokens = await getUserTokenAccounts(connection, selectedAccount.publicKey.toString());
      console.log('Tokens received:', tokens);
      setUserTokens(tokens);
      setHasLoadedTokens(true);
    } catch (error) {
      console.error('Error loading user tokens:', error);
      Alert.alert('Error', 'Failed to load your tokens. Please try again.');
    } finally {
      setIsLoadingTokens(false);
    }
  };

    const handleCreateOffer = async () => {
    if (!lendingAmount) {
      Alert.alert('Error', 'Please fill in the lending amount');
      return;
    }

    if (!selectedToken) {
      Alert.alert('Error', 'Please select a token to loan');
      return;
    }

    if (!selectedReceiveToken) {
      Alert.alert('Error', 'Please select a token to receive');
      return;
    }

    if (!interestRate || parseFloat(interestRate) <= 0) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }

    if (!durationDays || parseFloat(durationDays) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    if (!minScore || parseFloat(minScore) < 0) {
      Alert.alert('Error', 'Please enter a valid minimum score');
      return;
    }

    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid collateral amount');
      return;
    }

    if (!program || !connection || !wallet) {
      Alert.alert('Error', 'Solana program not available. Please try again.');
      return;
    }

    const userPublicKey = selectedAccount?.publicKey;
    if (!userPublicKey) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('About to create loan offer with:');
      console.log('- program:', !!program);
      console.log('- connection:', !!connection);
      console.log('- wallet:', !!wallet);
      console.log('- userPublicKey:', userPublicKey.toString());
      console.log('- selectedToken:', selectedToken);
      console.log('- selectedAccount:', selectedAccount);
      
      // Add a small delay to ensure wallet connection is stable
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const signature = await createLoanOffer(
        program,
        connection,
        wallet,
        userPublicKey,
        selectedToken,
        lendingAmount,
        selectedReceiveToken,
        interestRate,
        durationDays,
        minScore,
        collateralAmount
      );
      
      console.log('Transaction signature:', signature);
      
      // Create PDA for the loan info to get offer address
      const loanInfoPda = createLoanInfoPDA(
        userPublicKey,
        new PublicKey(selectedToken.mint.toString()),
        program.programId
      );
      
      // Get accepted token mint based on selection
      let acceptedTokenMint: string;
      if (selectedReceiveToken === 'SOL') {
        // Use wrapped SOL mint address
        acceptedTokenMint = 'So11111111111111111111111111111111111111112';
      } else if (selectedReceiveToken === 'BONK') {
        // Use BONK mint address
        acceptedTokenMint = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
      } else {
        acceptedTokenMint = selectedToken.mint.toString();
      }
      
      // Ensure user exists in database first
      try {
        await apiClient.getOrCreateUser(userPublicKey.toString());
        console.log('User ensured in database for loan offer creation');
      } catch (userError) {
        console.warn('Could not create user in database:', userError);
      }

      // Save to backend database with all required fields
      try {
        const loanOfferData = {
          offer_address: loanInfoPda.toString(),
          lender_address: userPublicKey.toString(),
          amount: parseFloat(lendingAmount),
          apy: parseFloat(interestRate),
          duration: parseInt(durationDays) * 24 * 60 * 60, // Convert days to seconds
          token: getTokenSymbol(selectedToken.mint.toString()),
          collateral_token: selectedReceiveToken,
          collateral_amount: parseFloat(collateralAmount),
          min_score: parseInt(minScore),
          is_active: true,
          // New required fields
          loan_mint: selectedToken.mint.toString(),
          collateral_mint: acceptedTokenMint,
          loan_name: getTokenSymbol(selectedToken.mint.toString()),
          collateral_name: selectedReceiveToken,
          loan_amount: parseFloat(lendingAmount),
        };
        
        console.log('Sending loan offer data to backend:', loanOfferData);
        const savedOffer = await apiClient.createLoanOffer(loanOfferData);
        console.log('Saved offer to backend:', savedOffer);
        
        Alert.alert('Success', `Loan offer created for ${getTokenSymbol(selectedToken.mint.toString())} → ${selectedReceiveToken}!`);
      } catch (backendError) {
        console.error('Failed to save to backend:', backendError);
        Alert.alert('Partial Success', 'Loan offer created on blockchain but failed to save to database. The transaction is still valid.');
      }

      // Reset form
      setLendingAmount('');
      setSelectedToken(null);
      setSelectedReceiveToken(null);
      setInterestRate('5');
      setDurationDays('30');
      setMinScore('0');
      setCollateralAmount('');

    } catch (error: any) {
      console.error('Error creating loan offer:', error);
      
      // Handle specific error types with user-friendly messages
      let errorMessage = 'Unknown error';
      if (error && error.message) {
        if (error.message.includes('authorization') || error.message.includes('SolanaMobileWalletAdapterProtocolError')) {
          errorMessage = 'Wallet authorization failed. Please try connecting your wallet again.';
          Alert.alert('Wallet Error', errorMessage, [
            { text: 'OK', style: 'default' },
            { text: 'Reconnect Wallet', onPress: () => {
              // User can manually reconnect by going back and forth
              Alert.alert('Reconnection', 'Please disconnect and reconnect your wallet from the Connect button.');
            }}
          ]);
          return;
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to complete this transaction.';
        } else if (error.message.includes('simulation failed')) {
          errorMessage = 'Transaction validation failed. Please check your inputs and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', `Failed to create loan offer: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTokenModal = () => (
    <Modal
      visible={showTokenModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTokenModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Token to Loan</Text>
            <TouchableOpacity onPress={() => setShowTokenModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {isLoadingTokens ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your tokens...</Text>
            </View>
                     ) : userTokens.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>No tokens found in your wallet</Text>
                               <TouchableOpacity style={styles.refreshButton} onPress={loadUserTokens}>
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
             </View>
          ) : (
            <ScrollView style={styles.tokenList}>
              {userTokens.map((token, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tokenItem}
                  onPress={() => {
                    setSelectedToken(token);
                    setShowTokenModal(false);
                  }}
                >
                  <View style={styles.tokenInfo}>
                    <Text style={styles.tokenSymbol}>
                      {getTokenSymbol(token.mint.toString())}
                    </Text>
                    <Text style={styles.tokenBalance}>
                      Balance: {token.balance.toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Lending Offer</Text>
          <Text style={styles.subtitle}>Set your terms and start earning</Text>
        </View>
        <TouchableOpacity onPress={loadUserTokens} style={styles.debugButton}>
          <Text style={styles.debugButtonText}>Load Tokens</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Lending Offer</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Lending Amount {selectedToken ? `(${getTokenSymbol(selectedToken.mint.toString())})` : ''}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={selectedToken ? `e.g., ${Math.floor(selectedToken.balance * 0.1).toLocaleString()}` : "Select a token first"}
              placeholderTextColor={Colors.textTertiary}
              value={lendingAmount}
              onChangeText={setLendingAmount}
              keyboardType="numeric"
              editable={!!selectedToken}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Token to Loan</Text>
            <TouchableOpacity 
              style={styles.dropdown} 
              onPress={() => setShowTokenModal(true)}
            >
              <Text style={[
                styles.dropdownText, 
                selectedToken ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder
              ]}>
                {selectedToken 
                  ? `${getTokenSymbol(selectedToken.mint.toString())} (${selectedToken.balance.toLocaleString()})`
                  : 'Select token from your wallet'
                }
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Interest Rate (%)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 5"
              placeholderTextColor={Colors.textTertiary}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (days)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 30"
              placeholderTextColor={Colors.textTertiary}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Score</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 0"
              placeholderTextColor={Colors.textTertiary}
              value={minScore}
              onChangeText={setMinScore}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Collateral Token</Text>
            <View style={styles.tokenOptions}>
              <TouchableOpacity 
                style={[styles.tokenOption, selectedReceiveToken === 'SOL' && styles.tokenOptionSelected]}
                onPress={() => setSelectedReceiveToken('SOL')}
              >
                <Text style={[styles.tokenOptionText, selectedReceiveToken === 'SOL' && styles.tokenOptionTextSelected]}>
                  SOL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tokenOption, selectedReceiveToken === 'BONK' && styles.tokenOptionSelected]}
                onPress={() => setSelectedReceiveToken('BONK')}
              >
                <Text style={[styles.tokenOptionText, selectedReceiveToken === 'BONK' && styles.tokenOptionTextSelected]}>
                  BONK
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Collateral Amount {selectedReceiveToken ? `(${selectedReceiveToken})` : ''}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={selectedReceiveToken ? `e.g., 1000` : "Select collateral token first"}
              placeholderTextColor={Colors.textTertiary}
              value={collateralAmount}
              onChangeText={setCollateralAmount}
              keyboardType="numeric"
              editable={!!selectedReceiveToken}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]} 
          onPress={handleCreateOffer}
          disabled={isSubmitting || !selectedToken || !selectedReceiveToken}
        >
          <Text style={styles.createButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Lending Offer'}
          </Text>
        </TouchableOpacity>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="locate" size={20} color={Colors.primary} />
            <Text style={styles.previewTitle}>Matching Preview</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Potential matches:</Text>
            <Text style={styles.previewValue}>12 requests</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Avg APY range:</Text>
            <Text style={styles.previewValue}>10-15%</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Est. time to match:</Text>
            <Text style={styles.previewValue}>2-4 hours</Text>
          </View>
        </View>
      </ScrollView>

      {renderTokenModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  formTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.borderLight,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.borderLight,
  },
  dropdownText: {
    fontSize: Typography.base,
    flex: 1,
  },
  dropdownTextPlaceholder: {
    color: Colors.textTertiary,
  },
  dropdownTextFilled: {
    color: Colors.textPrimary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  createButtonText: {
    color: Colors.textLight,
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  previewCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  refreshButtonText: {
    color: Colors.textLight,
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
  },
  tokenList: {
    maxHeight: 300,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tokenInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  tokenSymbol: {
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  tokenBalance: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewLabel: {
    fontSize: Typography.sm,
    color: Colors.overlayLight,
  },
  previewValue: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
  },
  debugButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  debugButtonText: {
    color: Colors.textLight,
    fontSize: Typography.sm,
    fontWeight: FontWeight.medium,
  },
  tokenOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tokenOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  tokenOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  tokenOptionText: {
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  tokenOptionTextSelected: {
    color: Colors.textLight,
  },
}); 