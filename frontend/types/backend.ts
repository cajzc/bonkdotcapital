export interface LoanOffer {
  id: string;
  offer_address: string;
  lender_address: string;
  amount: number;
  apy: number;
  token: string;
  duration: number;
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

export interface Loan {
  id: string;
  loan_address: string;
  lender_address: string;
  borrower_address: string;
  amount: number;
  apy: number;
  token: string;
  collateral_token: string;
  collateral_amount: number;
  duration: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface LoanRequest {
  id: string;
  request_address: string;
  borrower_address: string;
  amount: number;
  max_apy: number;
  token: string;
  collateral_token: string;
  collateral_amount: number;
  duration: number;
  is_active: boolean;
  created_at: string;
}

export interface LenderStat {
  address: string;
  apy: number;
}

export interface PlatformStats {
  total_volume: number;
  average_apy: number;
  active_loans_count: number;
  top_lenders: LenderStat[];
  popular_collaterals: string[];
}

export interface WebSocketMessage {
  type: 'offer_created' | 'offer_updated' | 'comment_created';
  data: any;
}