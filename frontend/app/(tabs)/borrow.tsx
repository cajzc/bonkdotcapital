import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

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

export default function BorrowScreen() {
  const [bonkAmount, setBonkAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [message, setMessage] = useState('');



  const handleSubmitRequest = () => {
    // Handle submit borrow request logic
    console.log('Submitting borrow request...');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Request BONK Loan</Text>
          <Text style={styles.subtitle}>Offer tokens as collateral</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loan Request Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Loan Request</Text>
          
          {/* BONK Amount Needed */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>BONK Amount Needed</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 25,000,000"
              placeholderTextColor="#9ca3af"
              value={bonkAmount}
              onChangeText={setBonkAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Token Offering */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Token Offering</Text>
            <Dropdown
              placeholder="Select token"
              value={selectedToken}
              onPress={() => {
                // Handle token selection
                console.log('Select token');
              }}
            />
          </View>

          {/* Token Amount Offering */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Token Amount Offering</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 50"
              placeholderTextColor="#9ca3af"
              value={tokenAmount}
              onChangeText={setTokenAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Loan Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loan Duration</Text>
            <Dropdown
              placeholder="Select duration"
              value={loanDuration}
              onPress={() => {
                // Handle duration selection
                console.log('Select duration');
              }}
            />
          </View>

          {/* Message to Lenders */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message to Lenders (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Tell lenders why you need this loan..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButtonContainer} onPress={handleSubmitRequest}>
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Submit Borrow Request</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Estimated APY Range */}
        <View style={styles.apyCard}>
          <View style={styles.apyHeader}>
            <Ionicons name="trending-up" size={20} color="#3b82f6" />
            <Text style={styles.apyTitle}>Estimated APY Range</Text>
          </View>
          <Text style={styles.apyValue}>12-18%</Text>
          <Text style={styles.apyDescription}>Based on current market rates</Text>
        </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  submitButtonContainer: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  apyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  apyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  apyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  apyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  apyDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});
