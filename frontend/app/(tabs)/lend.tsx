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
import { router } from 'expo-router';

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
      <Ionicons name="chevron-down" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

export default function LendScreen() {
  const [lendingAmount, setLendingAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [minTokenAmount, setMinTokenAmount] = useState('');
  const [minReputation, setMinReputation] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleCreateOffer = () => {
    // Handle create lending offer logic
    console.log('Creating lending offer...');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
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
              placeholderTextColor="#9ca3af"
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
              placeholderTextColor="#9ca3af"
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
              trackColor={{ false: '#d1d5db', true: '#f97316' }}
              thumbColor={autoAccept ? '#ffffff' : '#ffffff'}
              ios_backgroundColor="#d1d5db"
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
            <Ionicons name="locate" size={20} color="#f97316" />
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
    backgroundColor: '#fafaf9', // light beige background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
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
  formCard: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownTextPlaceholder: {
    color: '#9ca3af',
  },
  dropdownTextFilled: {
    color: '#1f2937',
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#f97316',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981', // green
  },
});
