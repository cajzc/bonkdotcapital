import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { apiClient } from '../../lib/apiClient';
import type { Loan, LoanOffer, LoanRequest, UserProfile } from '../../types/backend';

type TabType = 'loans' | 'requests' | 'messages';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAuthorization();
  const [activeTab, setActiveTab] = useState<TabType>('loans');
  
  // User profile data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper functions
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const normalizeDuration = (duration: number): number => {
    if (duration > 365) {
      return Math.floor(duration / (24 * 60 * 60));
    }
    return duration;
  };

  const formatDuration = (days: number): string => {
    if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
    if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!selectedAccount?.publicKey) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to fetch user profile for:', selectedAccount.publicKey.toString());
      
      // First, ensure user exists in database
      try {
        await apiClient.getOrCreateUser(selectedAccount.publicKey.toString());
        console.log('User ensured in database');
      } catch (userError) {
        console.warn('Could not create user in database:', userError);
      }
      
      // Try to fetch profile directly first
      const profile = await apiClient.getUserProfile(selectedAccount.publicKey.toString());
      setUserProfile(profile);
      console.log('Successfully fetched user profile:', profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // If backend user endpoints don't exist yet, create a mock profile with real loan data
      if (error instanceof Error && error.message.includes('404')) {
        console.log('Backend user endpoints not implemented yet, fetching available loan data...');
        
        try {
          // Fetch what we can from existing endpoints
          // Since user-specific endpoints don't exist, fetch all data and filter by user address
          console.log('Fetching loans and offers for user:', selectedAccount.publicKey.toString());
          
          const [userLoans, allOffers] = await Promise.allSettled([
            apiClient.getUserLoans(selectedAccount.publicKey.toString()),
            apiClient.getLoanOffers() // Get all offers and filter by user
          ]);
          
          console.log('Promise.allSettled results:');
          console.log('userLoans status:', userLoans.status);
          if (userLoans.status === 'rejected') {
            console.log('userLoans error:', userLoans.reason);
          } else {
            console.log('userLoans value:', userLoans.value);
          }
          
          console.log('allOffers status:', allOffers.status);
          if (allOffers.status === 'rejected') {
            console.log('allOffers error:', allOffers.reason);
          } else {
            console.log('allOffers value type:', typeof allOffers.value, 'isArray:', Array.isArray(allOffers.value));
            console.log('allOffers count:', allOffers.value?.length || 'null/undefined');
          }

          // Safely extract data with null checks
          const safeUserLoans = (userLoans.status === 'fulfilled' && userLoans.value && Array.isArray(userLoans.value)) ? 
            userLoans.value : [];
          const safeAllOffers = (allOffers.status === 'fulfilled' && allOffers.value && Array.isArray(allOffers.value)) ? 
            allOffers.value : [];
          
          console.log('Safe user loans:', safeUserLoans.length);
          console.log('Safe all offers:', safeAllOffers.length);
          console.log('Current user address:', selectedAccount.publicKey.toString());

          // Create mock profile with available data
          const mockProfile: UserProfile = {
            user: {
              id: selectedAccount.publicKey.toString(),
              wallet_address: selectedAccount.publicKey.toString(),
              credit_score: 0,
              total_loans_as_lender: 0,
              total_loans_as_borrower: 0,
              total_volume_lent: 0,
              total_volume_borrowed: 0,
              default_count: 0,
              successful_loans_count: 0,
              join_date: new Date().toISOString(),
              last_active: new Date().toISOString(),
              is_active: true,
            },
            active_loans_as_borrower: safeUserLoans.filter(loan => 
              loan && loan.is_active && loan.borrower_address === selectedAccount.publicKey.toString()
            ),
            active_loans_as_lender: safeUserLoans.filter(loan => 
              loan && loan.is_active && loan.lender_address === selectedAccount.publicKey.toString()
            ),
            completed_loans_as_borrower: safeUserLoans.filter(loan => 
              loan && !loan.is_active && loan.borrower_address === selectedAccount.publicKey.toString()
            ),
            completed_loans_as_lender: safeUserLoans.filter(loan => 
              loan && !loan.is_active && loan.lender_address === selectedAccount.publicKey.toString()
            ),
            active_offers: safeAllOffers.filter(offer => {
              if (!offer) return false;
              const isActive = offer.is_active;
              const isUserOffer = offer.lender_address === selectedAccount.publicKey.toString();
              console.log(`Offer ${offer.id}: active=${isActive}, userOffer=${isUserOffer}, lender=${offer.lender_address}`);
              return isActive && isUserOffer;
            }),
            active_requests: [],
            total_stats: {
              loans_completed: 0,
              total_volume: 0,
              average_apy: 0,
              success_rate: 0,
            }
          };

          console.log('Created mock profile with available data:', mockProfile);
          console.log('User active offers found:', mockProfile.active_offers.length);
          console.log('Offers:', mockProfile.active_offers);
          setUserProfile(mockProfile);
          
        } catch (fallbackError) {
          console.error('Failed to fetch fallback data:', fallbackError);
          console.error('Fallback error details:', fallbackError);
          
          // Create minimal mock profile as last resort
          const minimalProfile: UserProfile = {
            user: {
              id: selectedAccount.publicKey.toString(),
              wallet_address: selectedAccount.publicKey.toString(),
              credit_score: 0,
              total_loans_as_lender: 0,
              total_loans_as_borrower: 0,
              total_volume_lent: 0,
              total_volume_borrowed: 0,
              default_count: 0,
              successful_loans_count: 0,
              join_date: new Date().toISOString(),
              last_active: new Date().toISOString(),
              is_active: true,
            },
            active_loans_as_borrower: [],
            active_loans_as_lender: [],
            completed_loans_as_borrower: [],
            completed_loans_as_lender: [],
            active_offers: [],
            active_requests: [],
            total_stats: {
              loans_completed: 0,
              total_volume: 0,
              average_apy: 0,
              success_rate: 0,
            }
          };
          
          console.log('Using minimal profile due to API errors');
          setUserProfile(minimalProfile);
        }
      } else {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [selectedAccount]);

  // Refresh profile when this screen comes into focus (when user switches to profile tab)
  useFocusEffect(
    React.useCallback(() => {
      if (selectedAccount?.publicKey) {
        console.log('Profile tab focused, refreshing data...');
        fetchUserProfile();
      }
    }, [selectedAccount])
  );

  const renderLoanCard = (loan: Loan, type: 'borrower' | 'lender') => (
    <View key={loan.id} style={styles.loanCard}>
      <View style={styles.loanHeader}>
        <Text style={styles.loanTitle}>
          {type === 'borrower' ? 'Borrowed' : 'Lent'} Loan
        </Text>
        <View style={[styles.activeTag, loan.is_active ? styles.activeTagActive : styles.activeTagInactive]}>
          <Text style={styles.activeTagText}>{loan.is_active ? 'Active' : 'Completed'}</Text>
        </View>
      </View>
      
      <View style={styles.loanDetails}>
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Amount:</Text>
          <Text style={styles.loanDetailValue}>{formatNumber(loan.amount)} {loan.token || 'tokens'}</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Collateral:</Text>
          <Text style={styles.loanDetailValue}>{formatNumber(loan.collateral_amount)} {loan.collateral_token}</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>APY:</Text>
          <Text style={styles.loanDetailValueGreen}>{loan.apy.toFixed(1)}%</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Status:</Text>
          <Text style={styles.loanDetailValue}>{loan.is_active ? 'Active' : 'Completed'}</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Duration:</Text>
          <Text style={styles.loanDetailValue}>{formatDuration(normalizeDuration(loan.duration))}</Text>
        </View>
      </View>
      
      {type === 'borrower' && loan.is_active && (
        <View style={styles.loanActions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Repay Loan</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderOfferCard = (offer: LoanOffer) => (
    <View key={offer.id} style={styles.loanCard}>
      <View style={styles.loanHeader}>
        <Text style={styles.loanTitle}>Lending Offer</Text>
        <View style={[styles.activeTag, offer.is_active ? styles.activeTagActive : styles.activeTagInactive]}>
          <Text style={styles.activeTagText}>{offer.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      
      <View style={styles.loanDetails}>
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Amount:</Text>
          <Text style={styles.loanDetailValue}>{formatNumber(offer.loan_amount || offer.amount)} {offer.loan_name || offer.token || 'tokens'}</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Collateral:</Text>
          <Text style={styles.loanDetailValue}>{formatNumber(offer.collateral_amount || 0)} {offer.collateral_name || offer.collateral_token}</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>APY:</Text>
          <Text style={styles.loanDetailValueGreen}>{offer.apy.toFixed(1)}%</Text>
        </View>
        
        <View style={styles.loanDetailRow}>
          <Text style={styles.loanDetailLabel}>Duration:</Text>
          <Text style={styles.loanDetailValue}>{formatDuration(normalizeDuration(offer.duration))}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      );
    }

    if (!selectedAccount?.publicKey) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyStateText}>Please connect your wallet</Text>
        </View>
      );
    }

    if (!userProfile) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyStateText}>Failed to load profile</Text>
          <TouchableOpacity onPress={fetchUserProfile} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'loans':
        const activeBorrowing = userProfile.active_loans_as_borrower || [];
        const activeLending = userProfile.active_loans_as_lender || [];
        const completedBorrowing = userProfile.completed_loans_as_borrower || [];
        const completedLending = userProfile.completed_loans_as_lender || [];
        const activeOffers = userProfile.active_offers || [];
        
        const totalItems = activeBorrowing.length + activeLending.length + completedBorrowing.length + completedLending.length + activeOffers.length;
        
        if (totalItems === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No loans or offers yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first lending offer or borrow from the feed!</Text>
            </View>
          );
        }

        return (
          <View>
            {/* Active Borrowing */}
            {activeBorrowing.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Active Borrowings ({activeBorrowing.length})</Text>
                {activeBorrowing.map(loan => renderLoanCard(loan, 'borrower'))}
              </>
            )}

            {/* Active Lending */}
            {activeLending.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Active Lendings ({activeLending.length})</Text>
                {activeLending.map(loan => renderLoanCard(loan, 'lender'))}
              </>
            )}

            {/* Active Offers */}
            {activeOffers.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Your Lending Offers ({activeOffers.length})</Text>
                {activeOffers.map(offer => renderOfferCard(offer))}
              </>
            )}

            {/* Completed Borrowing */}
            {completedBorrowing.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Completed Borrowings ({completedBorrowing.length})</Text>
                {completedBorrowing.map(loan => renderLoanCard(loan, 'borrower'))}
              </>
            )}

            {/* Completed Lending */}
            {completedLending.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Completed Lendings ({completedLending.length})</Text>
                {completedLending.map(loan => renderLoanCard(loan, 'lender'))}
              </>
            )}
          </View>
        );
      case 'requests':
        if (!userProfile.active_requests || userProfile.active_requests.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateText}>No requests yet</Text>
              <Text style={styles.emptyStateSubtext}>Your borrowing requests will appear here</Text>
            </View>
          );
        }
        return (
          <View>
            <Text style={styles.sectionHeader}>Your Requests ({userProfile.active_requests.length})</Text>
            {/* TODO: Implement request cards similar to loan cards */}
          </View>
        );
      case 'messages':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>Your conversations will appear here</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {selectedAccount?.publicKey ? 
                selectedAccount.publicKey.toString().slice(0, 2).toUpperCase() : 
                'YU'
              }
            </Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>
              {userProfile?.user?.username || 
               (selectedAccount?.publicKey ? 
                 `${selectedAccount.publicKey.toString().slice(0, 6)}...${selectedAccount.publicKey.toString().slice(-4)}` : 
                 'Your Profile'
               )
              }
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.rating}>
                {userProfile?.user?.credit_score ? 
                  (userProfile.user.credit_score / 100).toFixed(1) : 
                  '0.0'
                }
              </Text>
              <Text style={styles.dealsText}>
                {userProfile?.total_stats?.loans_completed || 0} deals completed
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => {
              console.log('Manual profile refresh triggered');
              fetchUserProfile();
            }}
            disabled={loading}
          >
            <Ionicons 
              name="refresh-outline" 
              size={20} 
              color={loading ? Colors.textTertiary : Colors.primary} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loans' && styles.activeTab]}
          onPress={() => setActiveTab('loans')}
        >
          <Text style={[styles.tabText, activeTab === 'loans' && styles.activeTabText]}>
            My Loans
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Show a notice if using fallback data */}
        {userProfile && userProfile.user.credit_score === 0 && (
          <View style={styles.noticeContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.noticeText}>
              Profile showing available data. Tap the refresh button above if you don't see recent offers.
            </Text>
          </View>
        )}
        {renderTabContent()}
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
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.textLight,
    fontSize: Typography.lg,
    fontWeight: FontWeight.bold,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  dealsText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundWhite,
    ...Shadows.sm,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundWhite,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.borderLight,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  loanCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loanTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  activeTag: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  activeTagText: {
    color: Colors.textLight,
    fontSize: Typography.xs,
    fontWeight: FontWeight.semibold,
  },
  loanDetails: {
    marginBottom: Spacing.xl,
  },
  loanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loanDetailLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  loanDetailValue: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  loanDetailValueGreen: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.textPrimary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    minWidth: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
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
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: Colors.textLight,
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
  },
  sectionHeader: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  activeTagActive: {
    backgroundColor: Colors.success,
  },
  activeTagInactive: {
    backgroundColor: Colors.textTertiary,
  },
  loanActions: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
