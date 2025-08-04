// Backend API types for the BonkDotCapital frontend

export interface LoanOffer {
  id: string;
  lender_address: string;
  amount: number;
  token: string;
  apy: number;
  duration: number;
  is_active: boolean;
  created_at: string;
}

export interface LoanRequest {
  id: string;
  borrower_address: string;
  amount: number;
  collateral_token: string;
  collateral_amount: number;
  max_apy: number;
  duration: number;
  is_active: boolean;
  created_at: string;
}

export interface Loan {
  id: string;
  lender_address: string;
  borrower_address: string;
  amount: number;
  collateral_token: string;
  collateral_amount: number;
  apy: number;
  duration: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  offer_id: string;
  user_address: string;
  content: string;
  created_at: string;
}

export interface PlatformStats {
  total_volume: number;
  average_apy: number;
  active_loans_count: number;
  top_lenders: LenderStat[];
  popular_collaterals: string[];
}

export interface LenderStat {
  address: string;
  apy: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  room?: string;
}

export interface ApiError {
  error: string;
  status?: number;
}