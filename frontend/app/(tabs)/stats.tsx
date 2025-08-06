import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load platform stats from backend
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPlatformStats();
      setStats(response);
      console.log('Loaded stats:', response);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Failed to load stats');
      // Use fallback stats if API fails
      setStats({
        total_volume: 0,
        average_apy: 0,
        active_loans_count: 0,
        top_lenders: [],
        popular_collaterals: ['SOL', 'BONK'],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Helper functions for formatting
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Market Insights</Text>
        <Text style={styles.subtitle}>Platform statistics and trends</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="link"
            iconColor={Colors.primary}
            value={loading ? "..." : formatVolume(stats?.total_volume || 0)}
            label="Total Volume"
          />
          <StatCard
            icon="trending-up"
            iconColor={Colors.success}
            value={loading ? "..." : `${(stats?.average_apy || 0).toFixed(1)}%`}
            label="Avg APY"
          />
          <StatCard
            icon="people"
            iconColor={Colors.info}
            value={loading ? "..." : (stats?.active_loans_count || 0).toLocaleString()}
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
            {loading ? (
              <Text style={styles.loadingText}>Loading top lenders...</Text>
            ) : stats?.top_lenders && stats.top_lenders.length > 0 ? (
              stats.top_lenders.slice(0, 3).map((lender, index) => (
                <TopLender
                  key={lender.address}
                  rank={index + 1}
                  username={`${lender.address.slice(0, 6)}...${lender.address.slice(-4)}`}
                  amountLent="N/A" // Volume data not available yet
                  avgApy={`${lender.apy.toFixed(1)}%`}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No top lenders data available yet.</Text>
            )}
          </View>
        </View>

        {/* Popular Collateral Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Collateral Tokens</Text>
          <View style={styles.tokensList}>
            {loading ? (
              <Text style={styles.loadingText}>Loading collateral data...</Text>
            ) : stats?.popular_collaterals && stats.popular_collaterals.length > 0 ? (
              stats.popular_collaterals.slice(0, 3).map((token, index) => {
                const colors = [Colors.purple, Colors.info, Colors.success];
                const percentages = [45, 28, 19]; // Mock percentages for now
                return (
                  <TokenProgress
                    key={token}
                    token={token}
                    percentage={percentages[index] || 10}
                    color={colors[index] || Colors.primary}
                  />
                );
              })
            ) : (
              <Text style={styles.emptyText}>No collateral data available yet.</Text>
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
  loadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontStyle: 'italic',
  },
});
