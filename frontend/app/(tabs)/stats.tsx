import React from 'react';
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
            value="2.4B"
            label="Total BONK Lent"
          />
          <StatCard
            icon="trending-up"
            iconColor={Colors.success}
            value="12.8%"
            label="Avg APY"
          />
          <StatCard
            icon="people"
            iconColor={Colors.info}
            value="1,247"
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
            <TopLender
              rank={1}
              username="bonk_whale_420"
              amountLent="500M"
              avgApy="11.2%"
            />
            <TopLender
              rank={2}
              username="defi_king"
              amountLent="350M"
              avgApy="12.8%"
            />
            <TopLender
              rank={3}
              username="sol_lender"
              amountLent="280M"
              avgApy="13.1%"
            />
          </View>
        </View>

        {/* Popular Collateral Tokens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Collateral Tokens</Text>
          <View style={styles.tokensList}>
            <TokenProgress
              token="SOL"
              percentage={45}
              color={Colors.purple}
            />
            <TokenProgress
              token="JUP"
              percentage={28}
              color={Colors.info}
            />
            <TokenProgress
              token="USDC"
              percentage={19}
              color={Colors.success}
            />
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
});
