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
import type { LoanOffer, Comment, WebSocketMessage } from '../types/backend';
import { useSolanaProgram } from '../lib/Solana';
import { acceptLoan } from '../lib/instructions/CreateLoan';
import { PublicKey } from '@solana/web3.js';

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

const normalizeDuration = (duration: number): number => {
  // If duration is greater than 365, assume it's in seconds and convert to days
  // Otherwise assume it's already in days
  if (duration > 365) {
    return Math.floor(duration / (24 * 60 * 60)); // Convert seconds to days
  }
  return duration; // Already in days
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

export default function OfferDetailsScreen() {
  console.log('OfferDetailsScreen: Component initializing');
  
  const { selectedAccount } = useAuthorization();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  
  console.log('OfferDetailsScreen: selectedAccount:', selectedAccount);
  console.log('OfferDetailsScreen: offerId:', offerId);
  
  const [offer, setOffer] = useState<LoanOffer | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const { connection, wallet, program } = useSolanaProgram();

  const fetchOfferDetails = async () => {
    if (!offerId) return;
    
    try {
      const [offerData, commentsData] = await Promise.all([
        apiClient.getLoanOfferById(offerId),
        apiClient.getCommentsForOffer(offerId)
      ]);
      
      setOffer(offerData);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      Alert.alert('Error', 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferDetails();

    // Subscribe to WebSocket updates for this specific offer
    let unsubscribe: (() => void) | null = null;
    
    if (offerId) {
      try {
        unsubscribe = wsClient.subscribe(offerId, (message: any) => {
          console.log('WebSocket message received for offer:', message);
          
          // The backend sends the comment object directly, so treat the message as a comment
          if (message && message.id && message.content) {
            setComments(prevComments => {
              // Check if comment already exists to prevent duplicates (by ID)
              const commentExists = prevComments.some(comment => 
                comment.id === message.id || 
                (comment.content === message.content && comment.author === message.author)
              );
              
              if (!commentExists) {
                return [message, ...prevComments];
              }
              return prevComments;
            });
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
  }, [offerId]);

  const handleAcceptOffer = async () => {
    if (!offer || !selectedAccount?.publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!program || !connection || !wallet) {
      Alert.alert('Error', 'Solana program not available. Please try again.');
      return;
    }

    setAcceptingOffer(true);
    try {
      // Validate that we have a proper loan mint address
      if (!offer?.loan_mint) {
        Alert.alert('Error', 'This loan offer has invalid token mint data. Please try refreshing the page or contact support.');
        return;
      }

      // Validate that the loan mint looks like a valid PublicKey
      try {
        new PublicKey(offer.loan_mint);
      } catch (mintError) {
        Alert.alert('Error', 'This loan offer has an invalid token mint address. Please try a different offer.');
        return;
      }

      const loanOfferData = {
        tokenMint: offer.loan_mint, // Only use verified loan mint, no dangerous fallbacks
        lenderPublicKey: offer?.lender_address || '',
        amount: (offer?.amount || 0).toString(),
      };

      // Normalize duration from offer (convert from seconds to days if needed)
      const normalizeDuration = (duration: number): number => {
        if (duration > 365) {
          return Math.floor(duration / (24 * 60 * 60)); // Convert seconds to days
        }
        return duration; // Already in days
      };

      const signature = await acceptLoan(
        program,
        connection,
        wallet,
        selectedAccount.publicKey!,
        loanOfferData,
        offerId, // Pass the offer ID for backend update
        offer?.duration ? normalizeDuration(offer.duration) : undefined // Pass the actual duration
      );

      console.log('Loan accepted! Signature:', signature);
      Alert.alert('Success', `Loan accepted! You can now use ${formatNumber(offer?.amount || 0)} ${offer?.token || 'tokens'}`);
      
      // Refresh offer details to show updated status
      await fetchOfferDetails();
      
      // Navigate back to feed since this offer is now inactive
      router.push('/(tabs)/feed');
      
    } catch (error: any) {
      console.error('Error accepting loan:', error);
      Alert.alert('Error', `Failed to accept loan: ${error?.message || 'Unknown error'}`);
    } finally {
      setAcceptingOffer(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !offerId) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setSubmittingComment(true);
    
    try {
      // TODO: Remove this temporary test address when wallet is required again
      const testAddress = selectedAccount?.address || 'test-user-' + Math.random().toString(36).substr(2, 9);
      
      // Create optimistic comment with temporary ID
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticComment = {
        id: tempId,
        author: testAddress,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        isOptimistic: true,
      };
      
      // Add optimistic comment immediately
      setComments(prevComments => [optimisticComment, ...prevComments]);
      setNewComment('');
      
      // Send to backend
      const realComment = await apiClient.createComment(offerId, {
        author: testAddress,
        content: optimisticComment.content,
      });
      
      // Replace optimistic comment with real one (WebSocket won't add it again due to duplicate check)
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === tempId ? realComment : comment
        )
      );
      
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to post comment');
      
      // Remove optimistic comment on error
      setComments(prevComments => 
        prevComments.filter(comment => !comment.isOptimistic)
      );
      
      // Restore the comment text for retry
      setNewComment(newComment);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading offer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Offer not found</Text>
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
          <Text style={styles.headerTitle}>Offer Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Offer Details Card */}
          <View style={styles.offerCard}>
            <View style={styles.offerHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={24} color={Colors.textSecondary} />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.lenderAddress}>{shortenAddress(offer?.lender_address || '')}</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, offer?.is_active ? styles.activeDot : styles.inactiveDot]} />
                    <Text style={styles.statusText}>{offer?.is_active ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.lendingTag}>
                <Text style={styles.lendingText}>Lending</Text>
              </View>
            </View>

            <View style={styles.offerDetails}>
              <View style={styles.amountSection}>
                <Text style={styles.amount}>{formatNumber(offer?.loan_amount || offer?.amount || 0)} {offer?.loan_name || offer?.token || 'Token'}</Text>
                <Text style={styles.token}>Collateral: {formatNumber(offer?.collateral_amount || 0)} {offer?.collateral_name || offer?.collateral_token || 'Collateral'}</Text>
              </View>
              
              <View style={styles.termsSection}>
                <View style={styles.termItem}>
                  <Text style={styles.termLabel}>APY</Text>
                  <Text style={styles.termValue}>{(offer?.apy || 0).toFixed(1)}%</Text>
                </View>
                <View style={styles.termItem}>
                  <Text style={styles.termLabel}>Duration</Text>
                  <Text style={styles.termValue}>{formatDuration(normalizeDuration(offer?.duration || 0))}</Text>
                </View>
                <View style={styles.termItem}>
                  <Text style={styles.termLabel}>Created</Text>
                  <Text style={styles.termValue}>{offer?.created_at ? formatDate(offer.created_at) : 'N/A'}</Text>
                </View>
              </View>
            </View>

            {offer?.is_active && selectedAccount?.publicKey && (
              <TouchableOpacity 
                style={[styles.acceptButton, acceptingOffer && styles.acceptButtonDisabled]}
                onPress={handleAcceptOffer}
                disabled={acceptingOffer}
              >
                {acceptingOffer ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.textLight} />
                    <Text style={styles.acceptButtonText}>Accepting...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.acceptButtonText}>Accept Offer</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textLight} />
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {!selectedAccount?.publicKey && offer.is_active && (
              <View style={styles.connectPromptButton}>
                <Text style={styles.connectPromptText}>Connect wallet to accept offer</Text>
              </View>
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
                comments.map((comment, index) => (
                  <CommentItem key={comment.id || `comment-${index}`} comment={comment} />
                ))
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={32} color={Colors.textTertiary} />
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment on this offer</Text>
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
  offerCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  offerHeader: {
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
  lenderAddress: {
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
  lendingTag: {
    backgroundColor: SemanticColors.lending.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  lendingText: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: SemanticColors.lending.text,
  },
  offerDetails: {
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
  token: {
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
    backgroundColor: Colors.primary,
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
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  connectPromptButton: {
    backgroundColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  connectPromptText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
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
  connectPrompt: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  connectPromptText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
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