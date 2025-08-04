// API client for communicating with the BonkDotCapital backend

import { Platform } from 'react-native';
import type { 
  LoanOffer, 
  LoanRequest, 
  Loan, 
  Comment, 
  PlatformStats, 
  ApiError 
} from '../types/backend';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const API_BASE_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1')
  : 'http://your-production-server.com/api/v1';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Loan Offers
  async getLoanOffers(): Promise<LoanOffer[]> {
    return this.request<LoanOffer[]>('/offers/');
  }

  async getLoanOfferById(id: string): Promise<LoanOffer> {
    return this.request<LoanOffer>(`/offers/${id}/`);
  }

  async createLoanOffer(offer: Omit<LoanOffer, 'id' | 'created_at'>): Promise<LoanOffer> {
    return this.request<LoanOffer>('/offers/', {
      method: 'POST',
      body: JSON.stringify(offer),
    });
  }

  // Loan Requests
  async getLoanRequests(): Promise<LoanRequest[]> {
    return this.request<LoanRequest[]>('/requests/');
  }

  // User-specific data
  async getUserLoans(userAddress: string): Promise<Loan[]> {
    return this.request<Loan[]>(`/users/${userAddress}/loans/`);
  }

  async getUserRequests(userAddress: string): Promise<LoanRequest[]> {
    return this.request<LoanRequest[]>(`/users/${userAddress}/requests/`);
  }

  // Comments
  async getCommentsForOffer(offerId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/offers/${offerId}/comments/`);
  }

  async createComment(offerId: string, comment: Omit<Comment, 'id' | 'offer_id' | 'created_at'>): Promise<Comment> {
    return this.request<Comment>(`/offers/${offerId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  // Platform Statistics
  async getPlatformStats(): Promise<PlatformStats> {
    return this.request<PlatformStats>('/stats');
  }
}

export const apiClient = new ApiClient();