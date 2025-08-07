global.Buffer = require('buffer').Buffer;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicKey } from '@solana/web3.js';
import { useSolanaProgram } from '../../lib/Solana';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';


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

export default function BorrowScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAuthorization();
  const { connection, wallet, program } = useSolanaProgram();
  const [bonkAmount, setBonkAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!connection || !wallet || !program) {
      Alert.alert('Error', 'Solana connection or program not available. Please try again.');
      return;
    }

    if (!selectedAccount?.publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!bonkAmount || !selectedToken || !tokenAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // For demo purposes, we'll use placeholder values
      // In a real app, you'd get these from the selected loan offer
      const tokenMint = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'); // BONK token mint
      const lenderPublicKey = new PublicKey('11111111111111111111111111111111'); // Placeholder lender
      const amount = parseFloat(bonkAmount) * Math.pow(10, 6); // Convert to lamports

      // Find PDA for loan info (you'd get this from the selected offer)
      const [loanInfoPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('loan_info'),
          lenderPublicKey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        program.programId
      );

      // Find PDA for open loan
      const [openLoanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('open_loan'),
          loanInfoPda.toBuffer(),
          selectedAccount.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Find PDA for collateral vault
      const [collateralVaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('collateral_vault'),
          loanInfoPda.toBuffer(),
          selectedAccount.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Find PDA for vault
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          loanInfoPda.toBuffer(),
        ],
        program.programId
      );

      // Find the borrower's token account for the mint
      const borrowerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        selectedAccount.publicKey,
        false 
      );
      console.log('Borrower token account:', borrowerTokenAccount.toString());

      const txSignature = await program.methods
        .takeLoan(new BN(amount))
        .accounts({
          openLoan: openLoanPda,
          collateralVault: collateralVaultPda,
          borrowerTokenAccount: borrowerTokenAccount, 
          vault: vaultPda,
          loanInfo: loanInfoPda,
          borrower: selectedAccount.publicKey,
          lender: lenderPublicKey,
          tokenMint: tokenMint,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
          systemProgram: new PublicKey('11111111111111111111111111111111'),
          rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
          clock: new PublicKey('SysvarC1ock11111111111111111111111111111111'),
        })
        .rpc();

      Alert.alert('Success', `Loan accepted! Signature: ${txSignature}`);
      console.log('Loan accepted!', txSignature);

    } catch (error: unknown) {
      console.error('Error accepting loan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to accept loan: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Request BONK Loan</Text>
          <Text style={styles.subtitle}>Offer tokens as collateral</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loan Request Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Loan Request</Text>
          
          {/* BONK Amount Needed */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>BONK Amount Needed</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 25,000,000"
              placeholderTextColor={Colors.textTertiary}
              value={bonkAmount}
              onChangeText={setBonkAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Token Offering */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Token Offering</Text>
            <Dropdown
              placeholder="Select token"
              value={selectedToken}
              onPress={() => {
                // For now, set a default token
                setSelectedToken('BONK');
              }}
            />
          </View>

          {/* Token Amount Offering */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Token Amount Offering</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 50"
              placeholderTextColor={Colors.textTertiary}
              value={tokenAmount}
              onChangeText={setTokenAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Loan Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loan Duration</Text>
            <Dropdown
              placeholder="Select duration"
              value={loanDuration}
              onPress={() => {
                // For now, set a default duration
                setLoanDuration('30 days');
              }}
            />
          </View>

          {/* Message to Lenders */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message to Lenders (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell lenders why you need this loan..."
              placeholderTextColor={Colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButtonContainer, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmitRequest}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={[Colors.info, Colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Borrow Request'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Estimated APY Range */}
        <View style={styles.apyCard}>
          <View style={styles.apyHeader}>
            <Ionicons name="trending-up" size={20} color={Colors.info} />
            <Text style={styles.apyTitle}>Estimated APY Range</Text>
          </View>
          <Text style={styles.apyValue}>12-18%</Text>
          <Text style={styles.apyDescription}>Based on current market rates</Text>
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
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
  submitButtonContainer: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.info,
  },
  submitButton: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.textLight,
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
  },
  apyCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  apyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  apyTitle: {
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  apyValue: {
    fontSize: Typography.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.info,
    marginBottom: 4,
  },
  apyDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
