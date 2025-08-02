import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Shadows, BorderRadius, CommonStyles } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface DropdownProps {
  placeholder: string;
  value?: string;
  onPress: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({ placeholder, value, onPress }) => {
  return (
    <TouchableOpacity style={styles.dropdown} onPress={onPress}>
      <Text style={[styles.dropdownText, value ? styles.dropdownTextFilled : styles.dropdownTextPlaceholder]}>
        {value || placeholder}
      </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
};

export default function LendScreen() {
  const insets = useSafeAreaInsets();
  const [lendingAmount, setLendingAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [minTokenAmount, setMinTokenAmount] = useState('');
  const [minReputation, setMinReputation] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);



  const handleCreateOffer = () => {
    // Handle create lending offer logic
    console.log('Creating lending offer...');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Lending Offer</Text>
          <Text style={styles.subtitle}>Set your terms and start earning</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lending Offer Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Lending Offer</Text>
          
          {/* Lending Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lending Amount (BONK)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 50,000,000"
              placeholderTextColor={Colors.textTertiary}
              value={lendingAmount}
              onChangeText={setLendingAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Acceptable Token */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Acceptable Token</Text>
            <Dropdown
              placeholder="Select token"
              value={selectedToken}
              onPress={() => {
                // Handle token selection
                console.log('Select token');
              }}
            />
          </View>

          {/* Minimum Token Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Token Amount</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 100"
              placeholderTextColor={Colors.textTertiary}
              value={minTokenAmount}
              onChangeText={setMinTokenAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Min Reputation Score */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Min Reputation Score</Text>
            <Dropdown
              placeholder="Select minimum"
              value={minReputation}
              onPress={() => {
                // Handle reputation selection
                console.log('Select reputation');
              }}
            />
          </View>

          {/* Auto-accept Toggle */}
          <View style={styles.toggleGroup}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Auto-accept matching requests</Text>
              <Text style={styles.toggleDescription}>
                Automatically approve requests that meet your criteria
              </Text>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.textLight}
              ios_backgroundColor={Colors.border}
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleCreateOffer}>
          <Text style={styles.createButtonText}>Create Lending Offer</Text>
        </TouchableOpacity>

        {/* Matching Preview */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="locate" size={20} color={Colors.primary} />
            <Text style={styles.previewTitle}>Matching Preview</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Potential matches:</Text>
            <Text style={styles.previewValue}>12 requests</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Avg APY range:</Text>
            <Text style={styles.previewValue}>10-15%</Text>
          </View>
          
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Est. time to match:</Text>
            <Text style={styles.previewValue}>2-4 hours</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  headerContent: {
    flex: 1,
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
  formCard: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  formTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.borderLight,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.borderLight,
  },
  dropdownText: {
    fontSize: Typography.base,
    flex: 1,
  },
  dropdownTextPlaceholder: {
    color: Colors.textTertiary,
  },
  dropdownTextFilled: {
    color: Colors.textPrimary,
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleContent: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  toggleLabel: {
    fontSize: Typography.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  createButtonText: {
    color: Colors.textLight,
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
  },
  previewCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  previewTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewLabel: {
    fontSize: Typography.sm,
    color: Colors.overlayLight,
  },
  previewValue: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textLight,
  },
});
