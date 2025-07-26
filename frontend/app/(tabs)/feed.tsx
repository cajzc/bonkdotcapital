import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RequestCardProps {
  userImage: string;
  username: string;
  rating: number;
  type: 'Lending' | 'Borrowing';
  amount: string;
  collateral: string;
  apy: string;
  duration: string;
  description: string;
  comments: number;
}

const RequestCard: React.FC<RequestCardProps> = ({
  userImage,
  username,
  rating,
  type,
  amount,
  collateral,
  apy,
  duration,
  description,
  comments,
}) => {
  const isLending = type === 'Lending';
  
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: userImage }} style={styles.userImage} />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{username}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.rating}>{rating}</Text>
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
            color={isLending ? "#10b981" : "#3b82f6"} 
          />
          <Text style={styles.collateral}>{collateral}</Text>
        </View>
        <View style={styles.apyRow}>
          <Text style={styles.apy}>{apy} APY</Text>
          <Text style={styles.duration}>{duration}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.commentsContainer}>
          <Ionicons name="chatbubble-outline" size={16} color="#6b7280" />
          <Text style={styles.commentsCount}>{comments}</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>BonkDotCapital</Text>
          <Text style={styles.appSubtitle}>P2P BONK Lending</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.connectButton}>
            <Ionicons name="wallet-outline" size={16} color="white" />
            <Text style={styles.connectText}>Connect</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>247</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-up" size={20} color="#10b981" />
          </View>
          <Text style={styles.statLabel}>Avg APY</Text>
          <Text style={styles.statValue}>12.8%</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="link" size={20} color="#f97316" />
          </View>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>2.4B</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests..."
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Feed Content */}
      <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
        <RequestCard
          userImage="https://via.placeholder.com/40"
          username="bonk_whale_420"
          rating={4.8}
          type="Lending"
          amount="50M BONK"
          collateral="150 SOL SOL"
          apy="12.5%"
          duration="30 days"
          description="Looking for reliable SOL holders. Quick approval for 4.5+ reputation."
          comments={3}
        />
        
        <RequestCard
          userImage="https://via.placeholder.com/40"
          username="defi_degen"
          rating={4.2}
          type="Borrowing"
          amount="25M BONK"
          collateral="2,500 JUP JUP"
          apy="15.2%"
          duration="14 days"
          description="Offering premium JUP tokens. Can add more if needed."
          comments={7}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7ed', // slight orange hue background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316', // orange
  },
  appSubtitle: {
    fontSize: 14,
    color: '#6b7280', // gray
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    padding: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981', // green
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lendingTag: {
    backgroundColor: '#dcfce7',
  },
  borrowingTag: {
    backgroundColor: '#dbeafe',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lendingText: {
    color: '#166534',
  },
  borrowingText: {
    color: '#1e40af',
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
    color: '#1f2937',
    marginRight: 8,
  },
  collateral: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#10b981',
  },
  duration: {
    fontSize: 14,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
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
    color: '#6b7280',
  },
  viewDetailsButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewDetailsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
}); 