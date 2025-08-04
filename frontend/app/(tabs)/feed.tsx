import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, SemanticColors } from '../../constants';
import ConnectButton from '@/components/ConnectButton';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicKey } from '@solana/web3.js';
import { useSolanaProgram } from '../../lib/Solana';
import { Buffer } from 'buffer';

interface RequestCardProps {
  userImage: string;
  username: string;
  rating: number;
  type: 'Lending' | 'Borrowing';
  amount: string;
  collateral: string;
  apy: string;
  duration: string;
  description: string;
  comments: number;
}

const RequestCard: React.FC<RequestCardProps> = ({
  userImage,
  username,
  rating,
  type,
  amount,
  collateral,
  apy,
  duration,
  description,
  comments,
}) => {
  const isLending = type === 'Lending';
  const { selectedAccount } = useAuthorization();
  const { connection, wallet, program } = useSolanaProgram();
  const [isPaying, setIsPaying] = useState(false);

  const handlePayLoan = async () => {
    if (!connection || !wallet || !program) {
      Alert.alert('Error', 'Solana connection or program not available. Please try again.');
      return;
    }

    if (!selectedAccount?.publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsPaying(true);
    try {
      // For demo purposes, we'll use placeholder values
      // In a real app, you'd get these from the selected loan
      const tokenMint = new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'); // BONK token mint
      const lenderPublicKey = new PublicKey('11111111111111111111111111111111'); // Placeholder lender

      // Find PDA for loan offer
      const [loanOfferPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('loan_offer'),
          lenderPublicKey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        program.programId
      );

      // Find PDA for loan
      const [loanPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('loan'),
          loanOfferPda.toBuffer(),
          selectedAccount.publicKey.toBuffer(),
        ],
        program.programId
      );

      const txSignature = await program.methods
        .initializePayLoan()
        .accounts({
          loan: loanPda,
          loanOffer: loanOfferPda,
          borrowerTokenAccount: selectedAccount.publicKey, // You'll need the actual token account
          lenderTokenAccount: lenderPublicKey, // You'll need the actual lender token account
          borrower: selectedAccount.publicKey,
          tokenMint: tokenMint,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          clock: new PublicKey('SysvarC1ock11111111111111111111111111111111'),
        })
        .rpc();

      Alert.alert('Success', `Loan paid! Signature: ${txSignature}`);
      console.log('Loan paid!', txSignature);

    } catch (error: unknown) {
      console.error('Error paying loan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to pay loan: ${errorMessage}`);
    } finally {
      setIsPaying(false);
    }
  };
  
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: userImage }} style={styles.userImage} />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{username}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.warning} />
              <Text style={styles.rating}>{rating}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.typeTag, isLending ? styles.lendingTag : styles.borrowingTag]}>
          <Text style={[styles.typeText, isLending ? styles.lendingText : styles.borrowingText]}>
            {type}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{amount}</Text>
          <Ionicons 
            name={isLending ? "arrow-up" : "arrow-down"} 
            size={16} 
            color={isLending ? Colors.success : Colors.info} 
          />
          <Text style={styles.collateral}>{collateral}</Text>
        </View>
        <View style={styles.apyRow}>
          <Text style={styles.apy}>{apy} APY</Text>
          <Text style={styles.duration}>{duration}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.commentsContainer}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.commentsCount}>{comments}</Text>
        </View>
        <View style={styles.buttonContainer}>
          {!isLending && (
            <TouchableOpacity 
              style={[styles.payLoanButton, isPaying && styles.payLoanButtonDisabled]}
              onPress={handlePayLoan}
              disabled={isPaying}
            >
              <Text style={styles.payLoanButtonText}>
                {isPaying ? 'Paying...' : 'Pay Loan'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const { selectedAccount } = useAuthorization();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
            {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>BonkDotCapital</Text>
          <Text style={styles.appSubtitle}>P2P BONK Lending</Text>
        </View>
        <View style={styles.headerRight}>
          <ConnectButton />
        </View>
      </View>

       {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>247</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-up" size={20} color={Colors.success} />
          </View>
          <Text style={styles.statLabel}>Avg APY</Text>
          <Text style={styles.statValue}>12.8%</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="link" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>2.4B</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests..."
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

                   {/* Feed Content */}
      <ScrollView 
        style={styles.feedContainer} 
        contentContainerStyle={styles.feedContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <RequestCard
          userImage="https://via.placeholder.com/40"
          username="bonk_whale_420"
          rating={4.8}
          type="Lending"
          amount="50M BONK"
          collateral="150 SOL SOL"
          apy="12.5%"
          duration="30 days"
          description="Looking for reliable SOL holders. Quick approval for 4.5+ reputation."
          comments={3}
        />
        
        <RequestCard
          userImage="https://via.placeholder.com/40"
          username="defi_degen"
          rating={4.2}
          type="Borrowing"
          amount="25M BONK"
          collateral="2,500 JUP JUP"
          apy="15.2%"
          duration="14 days"
          description="Offering premium JUP tokens. Can add more if needed."
          comments={7}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  appSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notificationButton: {
    padding: Spacing.sm,
  },
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
  connectText: {
    color: Colors.textLight,
    fontWeight: FontWeight.semibold,
    fontSize: Typography.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  statIcon: {
    marginBottom: Spacing.sm,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  filterButton: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    padding: 14,
    ...Shadows.sm,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  feedContentContainer: {
    paddingBottom: 120, 
  },
  requestCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
    maxWidth: '70%',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  typeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 60,
    maxWidth: 80,
  },
  lendingTag: {
    backgroundColor: SemanticColors.lending.background,
  },
  borrowingTag: {
    backgroundColor: SemanticColors.borrowing.background,
  },
  typeText: {
    fontSize: Typography.xs,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    flexShrink: 1,
  },
  lendingText: {
    color: SemanticColors.lending.text,
  },
  borrowingText: {
    color: SemanticColors.borrowing.text,
  },
  requestDetails: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  collateral: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  apyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  apy: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  duration: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  viewDetailsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    ...Shadows.primary,
  },
  viewDetailsText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  payLoanButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Shadows.primary,
  },
  payLoanButtonDisabled: {
    opacity: 0.6,
  },
  payLoanButtonText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 12,
  },
});  