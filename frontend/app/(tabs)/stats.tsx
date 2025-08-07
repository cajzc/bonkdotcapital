import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/apiClient';
import type { PlatformStats, LenderStat } from '../../types/backend';

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

const getCollateralPercentage = (collateral: string, collaterals: string[]): number => {
  if (!collaterals.length) return 0;
  const count = collaterals.filter(c => c === collateral).length;
  return Math.round((count / collaterals.length) * 100);
};

const getUniqueCollaterals = (collaterals: string[]) => {
  const unique = [...new Set(collaterals)];
  return unique.slice(0, 3); // Show top 3
};

interface StatCardProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, value, label, loading = false }) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 8 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

interface TopLenderProps {
  rank: number;
  lender: LenderStat;
}

const TopLender: React.FC<TopLenderProps> = ({ rank, lender }) => {
  return (
    <View style={styles.lenderRow}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      <View style={styles.lenderInfo}>
        <Text style={styles.lenderUsername}>{shortenAddress(lender.address)}</Text>
        <Text style={styles.lenderStats}>{lender.apy.toFixed(1)}% avg APY</Text>
      </View>
    </View>
  );
};

interface TokenProgressProps {
  token: string;
  percentage: number;
  color: string;
}

const TokenProgress: React.FC<TokenProgressProps> = ({ token, percentage, color }) => {
  return (
    <View style={styles.tokenRow}>
      <Text style={styles.tokenName}>{token}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.progressText}>{percentage}%</Text>
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlatformStats = async () => {
    try {
      const stats = await apiClient.getPlatformStats();
      setPlatformStats(stats);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlatformStats();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Market Insights</Text>
        <Text style={styles.subtitle}>Platform statistics and trends</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Key Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="link"
            iconColor={Colors.primary}
            value={loading ? "..." : formatNumber(platformStats?.total_volume || 0)}
            label="Total Volume"
            loading={loading}
          />
          <StatCard
            icon="trending-up"
            iconColor={Colors.success}
            value={loading ? "..." : `${(platformStats?.average_apy || 0).toFixed(1)}%`}
            label="Avg APY"
            loading={loading}
          />
          <StatCard
            icon="people"
            iconColor={Colors.info}
            value={loading ? "..." : (platformStats?.active_loans_count || 0).toLocaleString()}
            label="Active Loans"
            loading={loading}
          />
          <StatCard
            icon="shield-checkmark"
            iconColor={Colors.purple}
            value={loading ? "..." : `${((1 - (platformStats?.successful_loans || 0) / Math.max(platformStats?.total_loans || 1, 1)) * 100).toFixed(1)}%`}
            label="Default Rate"
            loading={loading}
          />
        </View>

        {/* Top Lenders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Lenders</Text>
          <View style={styles.lendersList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading top lenders...</Text>
              </View>
            ) : platformStats?.top_lenders?.length ? (
              platformStats.top_lenders.slice(0, 3).map((lender, index) => (
                <TopLender
                  key={lender.address}
                  rank={index + 1}
                  lender={lender}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No lender data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Popular Collateral Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Collateral Tokens</Text>
          <View style={styles.tokensList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading collateral data...</Text>
              </View>
            ) : platformStats?.popular_collaterals?.length ? (
              getUniqueCollaterals(platformStats.popular_collaterals).map((collateral, index) => {
                const colors = [Colors.purple, Colors.info, Colors.success];
                const percentage = getCollateralPercentage(collateral, platformStats.popular_collaterals);
                return (
                  <TokenProgress
                    key={collateral}
                    token={collateral}
                    percentage={percentage}
                    color={colors[index] || Colors.primary}
                  />
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No collateral data available</Text>
              </View>
            )}
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  lendersList: {
    gap: Spacing.md,
  },
  lenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    color: Colors.textLight,
    fontSize: Typography.xs,
    fontWeight: FontWeight.bold,
  },
  lenderInfo: {
    flex: 1,
  },
  lenderUsername: {
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  lenderStats: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  tokensList: {
    gap: Spacing.lg,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenName: {
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    width: 60,
  },
  progressContainer: {
    flex: 1,
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
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    minWidth: 35,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
});
