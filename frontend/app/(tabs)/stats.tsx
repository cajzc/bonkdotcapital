import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Market Insights</Text>
        <Text style={styles.subtitle}>Platform statistics and trends</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="link"
            iconColor="#f97316"
            value="2.4B"
            label="Total BONK Lent"
          />
          <StatCard
            icon="trending-up"
            iconColor="#10b981"
            value="12.8%"
            label="Avg APY"
          />
          <StatCard
            icon="people"
            iconColor="#3b82f6"
            value="1,247"
            label="Active Loans"
          />
          <StatCard
            icon="shield-checkmark"
            iconColor="#8b5cf6"
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
              color="#8b5cf6"
            />
            <TokenProgress
              token="JUP"
              percentage={28}
              color="#3b82f6"
            />
            <TokenProgress
              token="USDC"
              percentage={19}
              color="#10b981"
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
    backgroundColor: '#fafaf9', // light beige background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  lendersList: {
    gap: 12,
  },
  lenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lenderInfo: {
    flex: 1,
  },
  lenderUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  lenderStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  tokensList: {
    gap: 16,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    width: 60,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 35,
  },
});
