// Backend API types for the BonkDotCapital frontend

export interface LoanOffer {
  id: string;
  // Core required fields
  offer_address?: string;
  lender_address: string;
  amount: number;
  apy: number;
  duration: number; // Duration (can be in days or seconds - needs normalization)
  token?: string;
  collateral_token?: string;
  collateral_amount?: number;
  min_score?: number;
  is_active: boolean;
  created_at?: string;
  // Mint addresses and names (optional for backward compatibility)
  loan_mint?: string;
  collateral_mint?: string;
  loan_name?: string;
  collateral_name?: string;
  loan_amount?: number;
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
  offer_id: string; // Reference to the original offer
  lender_address: string;
  borrower_address: string;
  amount: number;
  token: string; // e.g., 'BONK', 'SOL'
  loan_mint: string; // Token mint address
  collateral_token: string;
  collateral_mint: string; // Collateral mint address
  collateral_amount: number;
  apy: number;
  duration: number; // in seconds
  start_date: string;
  end_date: string;
  is_active: boolean; // true = loan is active, false = loan completed/defaulted
  transaction_signature: string; // Blockchain transaction signature
  open_loan_pda: string; // On-chain PDA for the active loan
  collateral_vault_pda: string; // On-chain PDA for collateral vault
  created_at: string;
}

export interface User {
  id: string;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  credit_score: number;
  total_loans_as_lender: number;
  total_loans_as_borrower: number;
  total_volume_lent: number;
  total_volume_borrowed: number;
  default_count: number;
  successful_loans_count: number;
  join_date: string;
  last_active: string;
  is_active: boolean;
}

export interface UserProfile {
  user: User;
  active_loans_as_borrower: Loan[];
  active_loans_as_lender: Loan[];
  completed_loans_as_borrower: Loan[];
  completed_loans_as_lender: Loan[];
  active_offers: LoanOffer[];
  active_requests: LoanRequest[];
  total_stats: {
    loans_completed: number;
    total_volume: number;
    average_apy: number;
    success_rate: number;
  };
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