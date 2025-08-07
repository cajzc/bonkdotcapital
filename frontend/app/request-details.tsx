import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, SemanticColors } from '../constants';
import { useAuthorization } from '../lib/AuthorizationProvider';
import { apiClient } from '../lib/apiClient';
import { wsClient } from '../lib/websocketClient';
import type { LoanRequest, Comment } from '../types/backend';

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

const formatDuration = (days: number): string => {
  if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
  if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
  return `${days} day${days !== 1 ? 's' : ''}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Ionicons name="person" size={16} color={Colors.textSecondary} />
        </View>
        <View style={styles.commentInfo}>
          <Text style={styles.commentAuthor}>{shortenAddress(comment.author)}</Text>
          <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
    </View>
  );
};

export default function RequestDetailsScreen() {
  const { selectedAccount } = useAuthorization();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  
  const [request, setRequest] = useState<LoanRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchRequestDetails = async () => {
    if (!requestId) return;
    
    try {
      console.log('Fetching request details for ID:', requestId);
      
      // Try to fetch request details first
      const requestData = await apiClient.getLoanRequestById(requestId);
      console.log('Request data fetched successfully:', requestData);
      setRequest(requestData);
      
      // Then try to fetch comments
      try {
        const commentsData = await apiClient.getCommentsForRequest(requestId);
        console.log('Comments data fetched successfully:', commentsData);
        setComments(commentsData || []);
      } catch (commentsError) {
        console.error('Error fetching comments (will continue without them):', commentsError);
        setComments([]); // Continue without comments if they fail to load
      }
      
    } catch (error) {
      console.error('Error fetching request details:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();

    // Subscribe to WebSocket updates for this specific request
    let unsubscribe: (() => void) | null = null;
    
    if (requestId) {
      try {
        unsubscribe = wsClient.subscribe(requestId, (message: any) => {
          console.log('WebSocket message received for request:', message);
          
          // The backend sends the comment object directly, so treat the message as a comment
          if (message && message.id && message.content) {
            setComments(prevComments => [message, ...prevComments]);
          }
        });
      } catch (error) {
        console.log('WebSocket connection failed:', error);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [requestId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !requestId) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setSubmittingComment(true);
    
    try {
      // TODO: Remove this temporary test address when wallet is required again
      const testAddress = selectedAccount?.address || 'test-user-' + Math.random().toString(36).substr(2, 9);
      
      const comment = await apiClient.createRequestComment(requestId, {
        author: testAddress,
        content: newComment.trim(),
      });
      
      setNewComment('');
      // Comment will be added via WebSocket, but add immediately for better UX
      setComments(prevComments => [comment, ...prevComments]);
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Request not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton} onPress={() => router.push('/(tabs)/feed')}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Request Details Card */}
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={24} color={Colors.textSecondary} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.borrowerAddress}>{shortenAddress(request.borrower_address)}</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, request.is_active ? styles.activeDot : styles.inactiveDot]} />
                    <Text style={styles.statusText}>{request.is_active ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.borrowingTag}>
                <Text style={styles.borrowingText}>Borrowing</Text>
              </View>
            </View>

            <View style={styles.requestDetails}>
              <View style={styles.amountSection}>
                <Text style={styles.amount}>{formatNumber(request.amount)} BONK</Text>
                <Text style={styles.collateral}>Collateral: {formatNumber(request.collateral_amount)} {request.collateral_token}</Text>
              </View>
              
              <View style={styles.termsSection}>
                <View style={styles.termItem}>
                  <Text style={styles.termLabel}>Max APY</Text>
                  <Text style={styles.termValue}>{request.max_apy.toFixed(1)}%</Text>
                </View>
                <View style={styles.termItem}>
                  <Text style={styles.termLabel}>Duration</Text>
                  <Text style={styles.termValue}>{formatDuration(request.duration)}</Text>
                </View>
                <View style={styles.termItem}>
                  <Text style={styles.termLabel}>Created</Text>
                  <Text style={styles.termValue}>{formatDate(request.created_at)}</Text>
                </View>
              </View>
            </View>

            {request.is_active && (
              <TouchableOpacity style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Make Offer</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsSectionHeader}>
              <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
              <Text style={styles.commentsSectionTitle}>Comments ({comments.length})</Text>
            </View>

            {/* Comment Input - Temporarily allows commenting without wallet */}
            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputAvatar}>
                <Ionicons name="person" size={16} color={Colors.textSecondary} />
              </View>
              <View style={styles.commentInputSection}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={Colors.textTertiary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[styles.submitButton, !newComment.trim() && styles.submitButtonDisabled]}
                  onPress={handleSubmitComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color={Colors.textLight} />
                  ) : (
                    <Ionicons name="send" size={16} color={Colors.textLight} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <View style={styles.commentsList}>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={32} color={Colors.textTertiary} />
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment on this request</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIconButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  requestCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  borrowerAddress: {
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: Colors.success,
  },
  inactiveDot: {
    backgroundColor: Colors.textTertiary,
  },
  statusText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  borrowingTag: {
    backgroundColor: SemanticColors.borrowing.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  borrowingText: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.borrowing.text,
  },
  requestDetails: {
    marginBottom: Spacing.lg,
  },
  amountSection: {
    marginBottom: Spacing.lg,
  },
  amount: {
    fontSize: Typography.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  collateral: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  termsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termItem: {
    alignItems: 'center',
  },
  termLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  termValue: {
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  acceptButton: {
    backgroundColor: Colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.primary,
  },
  acceptButtonText: {
    color: Colors.textLight,
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
  },
  commentsSection: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  commentsSectionTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 4,
  },
  commentInputSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.borderLight,
    minHeight: 40,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  commentsList: {
    gap: Spacing.md,
  },
  commentItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  commentDate: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  commentContent: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginLeft: 32,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  noCommentsText: {
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: Typography.lg,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    color: Colors.textLight,
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
  },
});