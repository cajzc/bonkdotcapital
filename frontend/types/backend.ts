// Backend API types for the BonkDotCapital frontend

export interface LoanOffer {
  id: string;
  // All fields are now nullable for maximum flexibility
  lender_address?: string | null;
  amount?: number | null;
  token?: string | null;
  apy?: number | null;
  duration?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  // New mint and name fields (nullable)
  loan_mint?: string | null;
  collateral_mint?: string | null;
  loan_name?: string | null;
  collateral_name?: string | null;
  loan_amount?: number | null;
  collateral_amount?: number | null;
}

export interface LoanRequest {
  id: string;
  // All fields are now nullable for maximum flexibility
  borrower_address?: string | null;
  amount?: number | null;
  collateral_token?: string | null;
  collateral_amount?: number | null;
  max_apy?: number | null;
  duration?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  // New mint and name fields (nullable)
  loan_mint?: string | null;
  collateral_mint?: string | null;
  loan_name?: string | null;
  collateral_name?: string | null;
  loan_amount?: number | null;
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
  author: string;
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