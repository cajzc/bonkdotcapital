import type { 
  LoanOffer, 
  Loan, 
  LoanRequest, 
  PlatformStats, 
  Comment 
} from '../types/backend';

const API_BASE_URL = 'http://localhost:8080/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Platform Stats
  async getPlatformStats(): Promise<PlatformStats> {
    return this.request<PlatformStats>('/stats');
  }

  // Loan Offers
  async getLoanOffers(): Promise<LoanOffer[]> {
    return this.request<LoanOffer[]>('/offers');
  }

  async getLoanOfferById(id: string): Promise<LoanOffer> {
    return this.request<LoanOffer>(`/offers/${id}`);
  }

  async createLoanOffer(offer: Partial<LoanOffer>): Promise<LoanOffer> {
    return this.request<LoanOffer>('/offers', {
      method: 'POST',
      body: JSON.stringify(offer),
    });
  }

  // Comments
  async getOfferComments(offerId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/offers/${offerId}/comments`);
  }

  async createComment(offerId: string, comment: Partial<Comment>): Promise<Comment> {
    return this.request<Comment>(`/offers/${offerId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  // User Data
  async getUserLoans(userAddress: string): Promise<Loan[]> {
    return this.request<Loan[]>(`/users/${userAddress}/loans`);
  }

  async getUserRequests(userAddress: string): Promise<LoanRequest[]> {
    return this.request<LoanRequest[]>(`/users/${userAddress}/requests`);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;