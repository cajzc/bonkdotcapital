global.Buffer = require('buffer').Buffer;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, SemanticColors } from '../../constants';
import ConnectButton from '@/components/ConnectButton';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSolanaProgram } from '../../lib/Solana';
import { takeLoan, TakeLoanData } from '../../lib/instructions/TakeLoan';
import { apiClient } from '../../lib/apiClient';
import type { LoanOffer, PlatformStats } from '../../types/backend';
import { router } from 'expo-router';
import { PublicKey } from '@solana/web3.js';

// Helper functions
const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const shortenAddress = (address: string): string => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const normalizeDuration = (duration: number): number => {
  // If duration is greater than 365, assume it's in seconds and convert to days
  // Otherwise assume it's already in days
  if (duration > 365) {
    return Math.floor(duration / (24 * 60 * 60)); // Convert seconds to days
  }
  return duration; // Already in days
};

const formatDuration = (days: number): string => {
  if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
  if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}`;
};

interface OfferCardProps {
  offer: LoanOffer;
  onLoanTaken?: () => void; // Callback for when loan is successfully taken
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onLoanTaken }) => {
  console.log('OfferCard called with offer:', offer);
  
  // Safety check: ensure offer exists and has required fields
  if (!offer) {
    console.error('OfferCard: offer is null or undefined');
    return <View><Text>Invalid offer data</Text></View>;
  }

  if (!offer.id) {
    console.error('OfferCard: offer is missing ID field', offer);
    return <View><Text>Offer missing ID</Text></View>;
  }

  if (!offer.lender_address) {
    console.error('OfferCard: offer is missing lender_address field', offer);
    return <View><Text>Offer missing lender address</Text></View>;
  }

  const { selectedAccount } = useAuthorization();
  const { connection, wallet, program } = useSolanaProgram();
  const [isBorrowing, setIsBorrowing] = useState(false);

  const handleBorrow = async () => {
    console.log('handleBorrow called');
    console.log('Connection:', !!connection);
    console.log('Wallet:', !!wallet);
    console.log('Program:', !!program);
    console.log('Selected Account:', !!selectedAccount);
    console.log('Selected Account Public Key:', selectedAccount?.publicKey?.toString());

    if (!connection || !wallet || !program) {
      Alert.alert('Error', 'Solana connection or program not available. Please try again.');
      return;
    }

    if (!selectedAccount?.publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    setIsBorrowing(true);
    try {
      // Validate that we have a proper loan mint address
      if (!offer?.loan_mint) {
        Alert.alert('Error', 'This loan offer has invalid token mint data. Please try refreshing the page or contact support.');
        return;
      }

      // Validate that the loan mint looks like a valid PublicKey
      try {
        new PublicKey(offer.loan_mint);
      } catch (mintError) {
        Alert.alert('Error', 'This loan offer has an invalid token mint address. Please try a different offer.');
        return;
      }

      const takeLoanData: TakeLoanData = {
        tokenMint: offer.loan_mint, // Only use verified loan mint, no dangerous fallbacks
        lenderPublicKey: offer?.lender_address || '',
        amount: (offer?.amount || 0).toString(),
      };

      console.log('Calling takeLoan with data:', takeLoanData);
      console.log('Borrower public key:', selectedAccount.publicKey?.toString());

      // Normalize duration from offer (convert from seconds to days if needed)
      const normalizeDuration = (duration: number): number => {
        if (duration > 365) {
          return Math.floor(duration / (24 * 60 * 60)); // Convert seconds to days
        }
        return duration; // Already in days
      };

      const signature = await takeLoan(
        program,
        connection,
        wallet,
        selectedAccount.publicKey,
        takeLoanData,
        offer.id, // Pass the offer ID for backend update
        offer?.duration ? normalizeDuration(offer.duration) : undefined // Pass the actual duration
      );
      
      console.log('Loan taken! Signature:', signature);
      Alert.alert('Success', `Loan taken! You can now borrow ${formatNumber(offer?.amount || 0)} ${offer?.token || 'tokens'}`);

      // Notify parent component to refresh data
      if (onLoanTaken) {
        console.log('Notifying parent component to refresh data...');
        onLoanTaken();
      }

    } catch (error: any) {
      console.error('Error taking loan:', error);
      Alert.alert('Error', `Failed to take loan: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsBorrowing(false);
    }
  };
  
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color={Colors.textSecondary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{shortenAddress(offer?.lender_address || 'Unknown')}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, offer?.is_active ? styles.activeDot : styles.inactiveDot]} />
              <Text style={styles.statusText}>{offer?.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.lendingTag}>
          <Text style={styles.lendingText}>Lending</Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>
            {formatNumber(offer?.loan_amount || offer?.amount || 0)} {offer?.loan_name || offer?.token || 'Token'}
          </Text>
          <Ionicons 
            name="arrow-up" 
            size={16} 
            color={Colors.success}
          />
          <Text style={styles.collateral}>
            {formatNumber(offer?.collateral_amount || 0)} {offer?.collateral_name || offer?.collateral_token || 'Collateral'}
          </Text>
        </View>
        <View style={styles.apyRow}>
          <Text style={styles.apy}>{(offer?.apy || 0).toFixed(1)}% APY</Text>
          <Text style={styles.duration}>
            {formatDuration(normalizeDuration(offer?.duration || 0))}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.commentsContainer}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.commentsCount}>0</Text>
        </View>
        <View style={styles.buttonContainer}>
          {(() => {
            console.log('OfferCard button render - offer.is_active:', offer?.is_active, 'selectedAccount.publicKey:', !!selectedAccount?.publicKey);
            return null;
          })()}
          {offer?.is_active && selectedAccount?.publicKey && (
            <TouchableOpacity 
              style={[styles.borrowButton, isBorrowing && styles.borrowButtonDisabled]}
              onPress={handleBorrow}
              disabled={isBorrowing}
            >
              <Text style={styles.borrowButtonText}>
                {isBorrowing ? 'Borrowing...' : 'Borrow'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Debug info - show why borrow button might be hidden */}
          {!offer?.is_active && (
            <Text style={{fontSize: 10, color: 'red'}}>Offer inactive</Text>
          )}
          {!selectedAccount?.publicKey && (
            <Text style={{fontSize: 10, color: 'red'}}>No wallet connected</Text>
          )}
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push(`/offer-details?offerId=${offer?.id || ''}`)}
          >
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
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const offersData = await apiClient.getLoanOffers();
      console.log('Raw offers data from API:', offersData);
      
      // Validate and clean the offers data
      const validOffers = (offersData || []).filter((offer) => {
        if (!offer) {
          console.warn('Found null/undefined offer, skipping');
          return false;
        }
        
        if (!offer.id) {
          console.warn('Found offer without ID, skipping:', offer);
          return false;
        }
        
        if (!offer.lender_address) {
          console.warn('Found offer without lender_address, skipping:', offer);
          return false;
        }

        // Check if the offer has a valid loan_mint address
        if (!offer.loan_mint) {
          console.warn('Found offer without loan_mint, skipping:', offer);
          return false;
        }

        // Validate that loan_mint is a valid PublicKey format
        try {
          new PublicKey(offer.loan_mint);
        } catch (mintError) {
          console.warn('Found offer with invalid loan_mint format, skipping:', offer.loan_mint, mintError);
          return false;
        }
        
        return true;
      });
      
      console.log('Valid offers after filtering:', validOffers.length, 'out of', (offersData || []).length);
      setOffers(validOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      Alert.alert('Error', 'Failed to load offers. Please try again.');
      setOffers([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const stats = await apiClient.getPlatformStats();
      setPlatformStats(stats);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchPlatformStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
    fetchPlatformStats();
  };

  const handleLoanTaken = async () => {
    console.log('Loan taken, refreshing data...');
    setRefreshing(true);
    await Promise.all([fetchOffers(), fetchPlatformStats()]);
    setRefreshing(false);
  };

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
          <Text style={styles.statValue}>
            {statsLoading ? "..." : (platformStats?.active_loans_count || 0).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-up" size={20} color={Colors.success} />
          </View>
          <Text style={styles.statLabel}>Avg APY</Text>
          <Text style={styles.statValue}>
            {statsLoading ? "..." : `${(platformStats?.average_apy || 0).toFixed(1)}%`}
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="link" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>
            {statsLoading ? "..." : formatNumber(platformStats?.total_volume || 0)}
          </Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading offers...</Text>
          </View>
        ) : offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No offers available</Text>
            <Text style={styles.emptySubtext}>Be the first to create a lending offer!</Text>
          </View>
        ) : (
          offers
            .filter((offer) => offer && offer.id) // Filter out null/undefined offers
            .map((offer) => (
              <OfferCard key={offer.id} offer={offer} onLoanTaken={handleLoanTaken} />
            ))
        )}
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  inactiveDot: {
    backgroundColor: Colors.textTertiary,
  },
  statusText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
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
  borrowButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Shadows.primary,
  },
  borrowButtonDisabled: {
    opacity: 0.6,
  },
  borrowButtonText: {
    color: Colors.textLight,
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.base,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});  