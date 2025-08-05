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

// Use different URLs based on environment and platform
const getApiBaseUrl = () => {
  if (!__DEV__) {
    // Production URL - Update this with your actual AWS deployment URL
    return 'https://your-aws-domain.com/api/v1';
    // Examples:
    // return 'https://api.bonkdotcapital.com/api/v1';
    // return 'https://your-ec2-public-ip:8080/api/v1';
    // return 'https://your-alb-dns-name.us-east-1.elb.amazonaws.com/api/v1';
  }
  
  if (Platform.OS === 'android') {
    // For physical Android devices, use your computer's network IP
    // For Android emulator, use 10.0.2.2
    return 'http://192.168.1.111:8080/api/v1';
  } else {
    // For iOS simulator, web, or other platforms
    return 'http://localhost:8080/api/v1';
  }
};

const API_BASE_URL = getApiBaseUrl();

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

  async getLoanRequestById(id: string): Promise<LoanRequest> {
    return this.request<LoanRequest>(`/requests/${id}`);
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

  async getCommentsForRequest(requestId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/requests/${requestId}/comments`);
  }

  async createRequestComment(requestId: string, comment: Omit<Comment, 'id' | 'request_id' | 'created_at'>): Promise<Comment> {
    return this.request<Comment>(`/requests/${requestId}/comments`, {
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