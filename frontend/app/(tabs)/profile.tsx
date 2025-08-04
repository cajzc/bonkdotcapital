import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { apiClient } from '../../lib/apiClient';
import type { Loan, LoanRequest } from '../../types/backend';

type TabType = 'loans' | 'requests' | 'messages';

// Helper functions
const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const shortenAddress = (address: string): string => {
  if (!address) return 'Unknown';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const formatDuration = (days: number): string => {
  if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
  if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}`;
};

const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAuthorization();
  const [activeTab, setActiveTab] = useState<TabType>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    if (!selectedAccount) {
      setLoading(false);
      return;
    }

    try {
      const userAddress = selectedAccount.address;
      const [userLoans, userRequests] = await Promise.all([
        apiClient.getUserLoans(userAddress),
        apiClient.getUserRequests(userAddress)
      ]);

      setLoans(userLoans || []);
      setRequests(userRequests || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [selectedAccount]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const renderLoanCard = (loan: Loan, index: number) => {
    const daysRemaining = calculateDaysRemaining(loan.end_date);
    const totalDuration = loan.duration;
    const progressPercentage = Math.max(0, Math.min(100, ((totalDuration - daysRemaining) / totalDuration) * 100));
    
    return (
      <View key={loan.id} style={styles.loanCard}>
        <View style={styles.loanHeader}>
          <Text style={styles.loanTitle}>Loan #{index + 1}</Text>
          <View style={[styles.activeTag, { backgroundColor: loan.is_active ? Colors.success : Colors.textTertiary }]}>
            <Text style={styles.activeTagText}>{loan.is_active ? 'Active' : 'Completed'}</Text>
          </View>
        </View>
        
        <View style={styles.loanDetails}>
          <View style={styles.loanDetailRow}>
            <Text style={styles.loanDetailLabel}>Amount:</Text>
            <Text style={styles.loanDetailValue}>{formatNumber(loan.amount)} BONK</Text>
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
            <Text style={styles.loanDetailLabel}>Due:</Text>
            <Text style={styles.loanDetailValue}>{daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}</Text>
          </View>
        </View>
        
        {loan.is_active && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPercentage.toFixed(0)}% complete</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRequestCard = (request: LoanRequest, index: number) => {
    return (
      <View key={request.id} style={styles.loanCard}>
        <View style={styles.loanHeader}>
          <Text style={styles.loanTitle}>Request #{index + 1}</Text>
          <View style={[styles.activeTag, { backgroundColor: request.is_active ? Colors.info : Colors.textTertiary }]}>
            <Text style={styles.activeTagText}>{request.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        
        <View style={styles.loanDetails}>
          <View style={styles.loanDetailRow}>
            <Text style={styles.loanDetailLabel}>Amount:</Text>
            <Text style={styles.loanDetailValue}>{formatNumber(request.amount)} BONK</Text>
          </View>
          
          <View style={styles.loanDetailRow}>
            <Text style={styles.loanDetailLabel}>Collateral:</Text>
            <Text style={styles.loanDetailValue}>{formatNumber(request.collateral_amount)} {request.collateral_token}</Text>
          </View>
          
          <View style={styles.loanDetailRow}>
            <Text style={styles.loanDetailLabel}>Max APY:</Text>
            <Text style={styles.loanDetailValueGreen}>{request.max_apy.toFixed(1)}%</Text>
          </View>
          
          <View style={styles.loanDetailRow}>
            <Text style={styles.loanDetailLabel}>Duration:</Text>
            <Text style={styles.loanDetailValue}>{formatDuration(request.duration)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'loans':
        return loans.length > 0 ? (
          <View>
            {loans.map((loan, index) => renderLoanCard(loan, index))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No loans yet</Text>
            <Text style={styles.emptyStateSubtext}>Your active loans will appear here</Text>
          </View>
        );
      case 'requests':
        return requests.length > 0 ? (
          <View>
            {requests.map((request, index) => renderRequestCard(request, index))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No requests yet</Text>
            <Text style={styles.emptyStateSubtext}>Your borrowing requests will appear here</Text>
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
            <Text style={styles.avatarText}>YU</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>
              {selectedAccount ? shortenAddress(selectedAccount.address) : 'Your Profile'}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
              <Text style={styles.rating}>Connected</Text>
              <Text style={styles.dealsText}>
                {loans.length + requests.length} total items
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
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
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
