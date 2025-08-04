import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useSolanaProgram } from '../../lib/Solana';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { Buffer } from 'buffer';


interface DropdownProps {
  placeholder: string;
  value?: string;
  onPress: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({ placeholder, value, onPress }) => {
  return (
    <TouchableOpacity style={styles.dropdown} onPress={onPress}>
      <Text style={[styles.dropdownText, value ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder]}>
        {value || placeholder}
      </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
};

export default function LendScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAuthorization();
  const { connection, wallet, program } = useSolanaProgram();
  const [lendingAmount, setLendingAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [minTokenAmount, setMinTokenAmount] = useState('');
  const [minReputation, setMinReputation] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateOffer = async () => {
    if (!connection || !wallet || !program) {
      Alert.alert('Error', 'Solana connection or program not available. Please try again.');
      return;
    }

    if (!selectedAccount?.publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!lendingAmount || !selectedToken || !minTokenAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert amounts to proper format (assuming BONK has 5 decimals)
      const amount = Math.floor(parseFloat(lendingAmount) * 100000); // Convert to lamports
      const minScore = parseInt(minReputation) || 0;
      const interestRateBps = 500; // 5% interest rate (500 basis points)
      const durationSlots = 86400; // 1 day in slots (assuming 1 slot = 1 second)
      const bump = 0; // Will be calculated by the program

      // For now, use a placeholder token mint (you'll need to replace with actual token mints)
      const tokenMint = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'); // BONK token mint

      // Find PDA for loan offer
      const [loanOfferPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('loan_offer'),
          selectedAccount.publicKey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        program.programId
      );

      // Find PDA for vault
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          loanOfferPda.toBuffer(),
        ],
        program.programId
      );

      const txSignature = await program.methods
        .initializeCreateLoan(
          new BN(amount),
          new BN(interestRateBps),
          new BN(durationSlots),
          new BN(minScore),
          bump
        )
        .accounts({
          loanOffer: loanOfferPda,
          vault: vaultPda,
          lender: selectedAccount.publicKey,
          lenderTokenAccount: selectedAccount.publicKey, // You'll need the actual token account
          tokenMint: tokenMint,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          systemProgram: new PublicKey('11111111111111111111111111111111'),
          rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
        })
        .rpc();

      Alert.alert('Success', `Loan offer created! Signature: ${txSignature}`);
      console.log('Loan offer created!', txSignature);

    } catch (error: unknown) {
      console.error('Error creating loan offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to create loan offer: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Lending Offer</Text>
          <Text style={styles.subtitle}>Set your terms and start earning</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lending Offer Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Lending Offer</Text>
          
          {/* Lending Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lending Amount (BONK)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 50,000,000"
              placeholderTextColor={Colors.textTertiary}
              value={lendingAmount}
              onChangeText={setLendingAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Acceptable Token */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Acceptable Token</Text>
            <Dropdown
              placeholder="Select token"
              value={selectedToken}
              onPress={() => {
                // For now, set a default token
                setSelectedToken('BONK');
              }}
            />
          </View>

          {/* Minimum Token Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Token Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 100"
              placeholderTextColor={Colors.textTertiary}
              value={minTokenAmount}
              onChangeText={setMinTokenAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Min Reputation Score */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Min Reputation Score</Text>
            <Dropdown
              placeholder="Select minimum"
              value={minReputation}
              onPress={() => {
                // For now, set a default reputation score
                setMinReputation('4.0');
              }}
            />
          </View>

          {/* Auto-accept Toggle */}
          <View style={styles.toggleGroup}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Auto-accept matching requests</Text>
              <Text style={styles.toggleDescription}>
                Automatically approve requests that meet your criteria
              </Text>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.textLight}
              ios_backgroundColor={Colors.border}
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]} 
          onPress={handleCreateOffer}
          disabled={isSubmitting}
        >
          <Text style={styles.createButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Lending Offer'}
          </Text>
        </TouchableOpacity>

        {/* Matching Preview */}
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
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleContent: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  toggleLabel: {
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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
});
