package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type LoanOffer struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	OfferAddress  string             `bson:"offer_address" json:"offer_address"` // On-chain address of the LoanOffer account
	LenderAddress string             `bson:"lender_address" json:"lender_address"`
	Amount        float64            `bson:"amount" json:"amount"`
	APY           float64            `bson:"apy" json:"apy"`
	Token         string             `bson:"token" json:"token"`
	Duration      int64              `bson:"duration" json:"duration"`
	IsActive      bool               `bson:"is_active" json:"is_active"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
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
	RequestAddress   string             `bson:"request_address" json:"request_address"` // On-chain address of the LoanRequest account
	BorrowerAddress  string             `bson:"borrower_address" json:"borrower_address"`
	Amount           float64            `bson:"amount" json:"amount"`
	MaxAPY           float64            `bson:"max_apy" json:"max_apy"`
	Token            string             `bson:"token" json:"token"`
	CollateralToken  string             `bson:"collateral_token" json:"collateral_token"`
	CollateralAmount float64            `bson:"collateral_amount" json:"collateral_amount"`
	Duration         int64              `bson:"duration" json:"duration"`
	IsActive         bool               `bson:"is_active" json:"is_active"`
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
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