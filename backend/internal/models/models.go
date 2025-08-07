package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LoanOffer struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	OfferAddress     *string            `bson:"offer_address,omitempty" json:"offer_address,omitempty"` // On-chain address of the LoanOffer account
	LenderAddress	 *string            `bson:"lender_address,omitempty" json:"lender_address,omitempty"`
	Amount           *float64           `bson:"amount,omitempty" json:"amount,omitempty"`
	APY              *float64           `bson:"apy,omitempty" json:"apy,omitempty"`
	Token            *string            `bson:"token,omitempty" json:"token,omitempty"`
	Duration         *int64             `bson:"duration,omitempty" json:"duration,omitempty"`
	IsActive         *bool              `bson:"is_active,omitempty" json:"is_active,omitempty"`
	CreatedAt        *time.Time         `bson:"created_at,omitempty" json:"created_at,omitempty"`
	// New fields for mint addresses and names
	LoanMint         *string            `bson:"loan_mint,omitempty" json:"loan_mint,omitempty"`
	CollateralMint   *string            `bson:"collateral_mint,omitempty" json:"collateral_mint,omitempty"`
	LoanName         *string            `bson:"loan_name,omitempty" json:"loan_name,omitempty"`
	CollateralName   *string            `bson:"collateral_name,omitempty" json:"collateral_name,omitempty"`
	LoanAmount       *float64           `bson:"loan_amount,omitempty" json:"loan_amount,omitempty"`
	CollateralAmount *float64           `bson:"collateral_amount,omitempty" json:"collateral_amount,omitempty"`
}

type Comment struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id,omitempty"`
	OfferID   *primitive.ObjectID `bson:"offer_id,omitempty" json:"offer_id,omitempty"` // Links comment to a LoanOffer (optional)
	RequestID *primitive.ObjectID `bson:"request_id,omitempty" json:"request_id,omitempty"` // Links comment to a LoanRequest (optional)
	Author    string              `bson:"author" json:"author"`
	Content   string              `bson:"content" json:"content"`
	CreatedAt time.Time           `bson:"created_at" json:"created_at"`
}

type Loan struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	LoanAddress      string             `bson:"loan_address" json:"loan_address"` // On-chain address of the Loan account
	LenderAddress    string             `bson:"lender_address" json:"lender_address"`
	BorrowerAddress  string             `bson:"borrower_address" json:"borrower_address"`
	Amount           float64            `bson:"amount" json:"amount"`
	APY              float64            `bson:"apy" json:"apy"`
	Token            string             `bson:"token" json:"token"`
	CollateralToken  string             `bson:"collateral_token" json:"collateral_token"`
	CollateralAmount float64            `bson:"collateral_amount" json:"collateral_amount"`
	Duration         int64              `bson:"duration" json:"duration"`
	StartDate        time.Time          `bson:"start_date" json:"start_date"`
	EndDate          time.Time          `bson:"end_date" json:"end_date"`
	IsActive         bool               `bson:"is_active" json:"is_active"`
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
}

type LoanRequest struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	RequestAddress   *string            `bson:"request_address,omitempty" json:"request_address,omitempty"` // On-chain address of the LoanRequest account
	BorrowerAddress  *string            `bson:"borrower_address,omitempty" json:"borrower_address,omitempty"`
	Amount           *float64           `bson:"amount,omitempty" json:"amount,omitempty"`
	MaxAPY           *float64           `bson:"max_apy,omitempty" json:"max_apy,omitempty"`
	Token            *string            `bson:"token,omitempty" json:"token,omitempty"`
	CollateralToken  *string            `bson:"collateral_token,omitempty" json:"collateral_token,omitempty"`
	CollateralAmount *float64           `bson:"collateral_amount,omitempty" json:"collateral_amount,omitempty"`
	Duration         *int64             `bson:"duration,omitempty" json:"duration,omitempty"`
	IsActive         *bool              `bson:"is_active,omitempty" json:"is_active,omitempty"`
	CreatedAt        *time.Time         `bson:"created_at,omitempty" json:"created_at,omitempty"`
	// New fields for mint addresses and names
	LoanMint         *string            `bson:"loan_mint,omitempty" json:"loan_mint,omitempty"`
	CollateralMint   *string            `bson:"collateral_mint,omitempty" json:"collateral_mint,omitempty"`
	LoanName         *string            `bson:"loan_name,omitempty" json:"loan_name,omitempty"`
	CollateralName   *string            `bson:"collateral_name,omitempty" json:"collateral_name,omitempty"`
	LoanAmount       *float64           `bson:"loan_amount,omitempty" json:"loan_amount,omitempty"`
}

type LenderStat struct {
	Address string  `bson:"address" json:"address"`
	APY     float64 `bson:"apy" json:"apy"`
}

type PlatformStats struct {
	TotalVolume         float64      `bson:"total_volume" json:"total_volume"`
	AverageAPY          float64      `bson:"average_apy" json:"average_apy"`
	ActiveLoansCount    int64        `bson:"active_loans_count" json:"active_loans_count"`
	TopLenders          []LenderStat `bson:"top_lenders" json:"top_lenders"`
	PopularCollaterals  []string     `bson:"popular_collaterals" json:"popular_collaterals"`
}

type User struct {
	ID                     primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	WalletAddress          string             `bson:"wallet_address" json:"wallet_address"`
	Username               *string            `bson:"username,omitempty" json:"username,omitempty"`
	Email                  *string            `bson:"email,omitempty" json:"email,omitempty"`
	CreditScore            int32              `bson:"credit_score" json:"credit_score"`
	TotalLoansAsLender     int32              `bson:"total_loans_as_lender" json:"total_loans_as_lender"`
	TotalLoansAsBorrower   int32              `bson:"total_loans_as_borrower" json:"total_loans_as_borrower"`
	TotalVolumeLent        float64            `bson:"total_volume_lent" json:"total_volume_lent"`
	TotalVolumeBorrowed    float64            `bson:"total_volume_borrowed" json:"total_volume_borrowed"`
	DefaultCount           int32              `bson:"default_count" json:"default_count"`
	SuccessfulLoansCount   int32              `bson:"successful_loans_count" json:"successful_loans_count"`
	JoinDate               time.Time          `bson:"join_date" json:"join_date"`
	LastActive             time.Time          `bson:"last_active" json:"last_active"`
	IsActive               bool               `bson:"is_active" json:"is_active"`
	CreatedAt              time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt              time.Time          `bson:"updated_at" json:"updated_at"`
}

type UserStats struct {
	LoansCompleted int32   `bson:"loans_completed" json:"loans_completed"`
	TotalVolume    float64 `bson:"total_volume" json:"total_volume"`
	AverageAPY     float64 `bson:"average_apy" json:"average_apy"`
	SuccessRate    float64 `bson:"success_rate" json:"success_rate"`
}

type UserProfile struct {
	User                        User       `bson:"user" json:"user"`
	ActiveLoansAsBorrower       []Loan     `bson:"active_loans_as_borrower" json:"active_loans_as_borrower"`
	ActiveLoansAsLender         []Loan     `bson:"active_loans_as_lender" json:"active_loans_as_lender"`
	CompletedLoansAsBorrower    []Loan     `bson:"completed_loans_as_borrower" json:"completed_loans_as_borrower"`
	CompletedLoansAsLender      []Loan     `bson:"completed_loans_as_lender" json:"completed_loans_as_lender"`
	ActiveOffers                []LoanOffer `bson:"active_offers" json:"active_offers"`
	ActiveRequests              []LoanRequest `bson:"active_requests" json:"active_requests"`
	TotalStats                  UserStats  `bson:"total_stats" json:"total_stats"`
}