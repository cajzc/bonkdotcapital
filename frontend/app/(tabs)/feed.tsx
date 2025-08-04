import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, SemanticColors } from '../../constants';
import ConnectButton from '@/components/ConnectButton';
import { useAuthorization } from '../../lib/AuthorizationProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/apiClient';
import { wsClient } from '../../lib/websocketClient';
import type { LoanOffer, LoanRequest, PlatformStats, WebSocketMessage } from '../../types/backend';

interface RequestCardProps {
  offer?: LoanOffer;
  request?: LoanRequest;
  type: 'Lending' | 'Borrowing';
  onViewDetails?: () => void;
}

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

const RequestCard: React.FC<RequestCardProps> = ({
  offer,
  request,
  type,
  onViewDetails,
}) => {
  const isLending = type === 'Lending';
  const data = isLending ? offer : request;
  
  if (!data) return null;
  
  // Extract data based on type
  const username = isLending ? shortenAddress(offer!.lender_address) : shortenAddress(request!.borrower_address);
  const amount = `${formatNumber(data.amount)} BONK`;
  const collateral = isLending ? offer!.token : `${formatNumber(request!.collateral_amount)} ${request!.collateral_token}`;
  const apy = isLending ? offer!.apy.toFixed(1) : request!.max_apy.toFixed(1);
  const duration = formatDuration(data.duration);
  const description = isLending 
    ? `${offer!.is_active ? 'Active' : 'Inactive'} lending offer • Collateral: ${offer!.token}`
    : `${request!.is_active ? 'Active' : 'Inactive'} borrowing request • Collateral: ${request!.collateral_token}`;
  
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color={Colors.textSecondary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{username}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.rating}>Verified</Text>
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
          <Text style={styles.apy}>{apy}% APY</Text>
          <Text style={styles.duration}>{duration}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.commentsContainer}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.commentsCount}>0</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const { selectedAccount } = useAuthorization();
  const insets = useSafeAreaInsets();
  
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [offersData, requestsData, statsData] = await Promise.all([
        apiClient.getLoanOffers(),
        apiClient.getLoanRequests(),
        apiClient.getPlatformStats()
      ]);
      
      setOffers(offersData || []);
      setRequests(requestsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching feed data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Try to subscribe to WebSocket updates, but don't fail if it doesn't work
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = wsClient.subscribe('offers', (message: WebSocketMessage) => {
        console.log('WebSocket message received:', message);
        
        if (message.type === 'offer_created') {
          setOffers(prevOffers => [message.data, ...prevOffers]);
          fetchStats();
        }
      });
    } catch (error) {
      console.log('WebSocket connection failed, will rely on manual refresh:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await apiClient.getPlatformStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleViewDetails = (type: 'offer' | 'request', id: string) => {
    console.log(`View details for ${type}:`, id);
  };

  // Combine offers and requests for display
  const allItems = [
    ...offers.map(offer => ({ type: 'offer' as const, data: offer })),
    ...requests.map(request => ({ type: 'request' as const, data: request }))
  ];

  const filteredItems = allItems.filter(item => {
    const searchTerm = searchQuery.toLowerCase();
    if (item.type === 'offer') {
      return item.data.lender_address.toLowerCase().includes(searchTerm) ||
             item.data.token.toLowerCase().includes(searchTerm);
    } else {
      return item.data.borrower_address.toLowerCase().includes(searchTerm) ||
             item.data.collateral_token.toLowerCase().includes(searchTerm);
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading offers and requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.statValue}>{stats?.active_loans_count || 0}</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-up" size={20} color={Colors.success} />
          </View>
          <Text style={styles.statLabel}>Avg APY</Text>
          <Text style={styles.statValue}>{stats?.average_apy ? `${stats.average_apy.toFixed(1)}%` : '0%'}</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="link" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{stats?.total_volume ? formatNumber(stats.total_volume) : '0'}</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search offers and requests..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
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
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <RequestCard
              key={`${item.type}-${item.data.id || index}`}
              offer={item.type === 'offer' ? item.data as LoanOffer : undefined}
              request={item.type === 'request' ? item.data as LoanRequest : undefined}
              type={item.type === 'offer' ? 'Lending' : 'Borrowing'}
              onViewDetails={() => handleViewDetails(item.type, item.data.id || '')}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No offers or requests found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new activity'}
            </Text>
          </View>
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});