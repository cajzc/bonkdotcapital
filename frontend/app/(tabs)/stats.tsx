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
import type { PlatformStats } from '../../types/backend';

interface StatCardProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, value, label }) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

interface TopLenderProps {
  rank: number;
  username: string;
  amountLent: string;
  avgApy: string;
}

const TopLender: React.FC<TopLenderProps> = ({ rank, username, amountLent, avgApy }) => {
  return (
    <View style={styles.lenderRow}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      <View style={styles.lenderInfo}>
        <Text style={styles.lenderUsername}>{username}</Text>
        <Text style={styles.lenderStats}>{amountLent} lent • {avgApy} avg</Text>
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

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const platformStats = await apiClient.getPlatformStats();
      setStats(platformStats);
    } catch (err) {
      setError('Failed to load platform statistics');
      console.error('Error fetching platform stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading platform statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
            value={formatNumber(stats?.total_volume || 0)}
            label="Total BONK Lent"
          />
          <StatCard
            icon="trending-up"
            iconColor={Colors.success}
            value={stats?.average_apy ? `${stats.average_apy.toFixed(1)}%` : '0%'}
            label="Avg APY"
          />
          <StatCard
            icon="people"
            iconColor={Colors.info}
            value={stats?.active_loans_count?.toString() || '0'}
            label="Active Loans"
          />
          <StatCard
            icon="shield-checkmark"
            iconColor={Colors.purple}
            value="0.3%"
            label="Default Rate"
          />
        </View>

        {/* Top Lenders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Lenders</Text>
          <View style={styles.lendersList}>
            {stats?.top_lenders && stats.top_lenders.length > 0 ? (
              stats.top_lenders.map((lender, index) => (
                <TopLender
                  key={lender.address}
                  rank={index + 1}
                  username={shortenAddress(lender.address)}
                  amountLent="N/A"
                  avgApy={`${lender.apy.toFixed(1)}%`}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No lenders data available</Text>
            )}
          </View>
        </View>

        {/* Popular Collateral Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Collateral Tokens</Text>
          <View style={styles.tokensList}>
            {stats?.popular_collaterals && stats.popular_collaterals.length > 0 ? (
              stats.popular_collaterals.map((token, index) => (
                <TokenProgress
                  key={token}
                  token={token}
                  percentage={Math.max(10, 100 - (index * 20))} // Mock percentage for now
                  color={index === 0 ? Colors.purple : index === 1 ? Colors.info : Colors.success}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No token data available</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.base,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
