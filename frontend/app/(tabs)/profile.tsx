import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'loans' | 'requests' | 'messages';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('loans');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'loans':
        return (
          <View style={styles.loanCard}>
            <View style={styles.loanHeader}>
              <Text style={styles.loanTitle}>Active Loan #1</Text>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.loanDetails}>
              <View style={styles.loanDetailRow}>
                <Text style={styles.loanDetailLabel}>Amount:</Text>
                <Text style={styles.loanDetailValue}>25M BONK</Text>
              </View>
              
              <View style={styles.loanDetailRow}>
                <Text style={styles.loanDetailLabel}>Collateral:</Text>
                <Text style={styles.loanDetailValue}>1,250 JUP</Text>
              </View>
              
              <View style={styles.loanDetailRow}>
                <Text style={styles.loanDetailLabel}>APY:</Text>
                <Text style={styles.loanDetailValueGreen}>14.5%</Text>
              </View>
              
              <View style={styles.loanDetailRow}>
                <Text style={styles.loanDetailLabel}>Due:</Text>
                <Text style={styles.loanDetailValue}>12 days</Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%' }]} />
              </View>
              <Text style={styles.progressText}>60% complete</Text>
            </View>
          </View>
        );
      case 'requests':
        return (
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
            <Text style={styles.profileName}>Your Profile</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.rating}>4.7</Text>
              <Text style={styles.dealsText}>23 deals completed</Text>
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
});
