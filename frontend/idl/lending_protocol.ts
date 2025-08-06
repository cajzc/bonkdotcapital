/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/lending_protocol.json`.
 */
export type LendingProtocol = {
  "address": "5KZEGGgKN8FEKXHvqjJ169Adxdkj2JmNVNfHdRBytsvS",
  "metadata": {
    "name": "lendingProtocol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [],
      "args": []
    },
    {
      "name": "initializeCreateLoan",
      "discriminator": [
        108,
        19,
        84,
        115,
        75,
        200,
        243,
        236
      ],
      "accounts": [
        {
          "name": "loanOffer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110,
                  95,
                  111,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "lender"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "loanOffer"
              }
            ]
          }
        },
        {
          "name": "lender",
          "writable": true,
          "signer": true
        },
        {
          "name": "lenderTokenAccount",
          "writable": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "interestRateBps",
          "type": "u16"
        },
        {
          "name": "durationSlots",
          "type": "u64"
        },
        {
          "name": "minScore",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializeObligation",
      "discriminator": [
        93,
        178,
        46,
        182,
        79,
        238,
        67,
        69
      ],
      "accounts": [
        {
          "name": "obligation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  98,
                  108,
                  105,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "borrowerTokenAccount",
          "writable": true
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "borrower",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initializePayLoan",
      "discriminator": [
        123,
        141,
        100,
        217,
        169,
        16,
        101,
        21
      ],
      "accounts": [
        {
          "name": "loan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "loanOffer"
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "loanOffer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110,
                  95,
                  111,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "loan_offer.lender",
                "account": "loanOffer"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "obligation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  98,
                  108,
                  105,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "borrowerTokenAccount",
          "writable": true
        },
        {
          "name": "lenderTokenAccount",
          "writable": true
        },
        {
          "name": "borrower",
          "writable": true,
          "signer": true,
          "relations": [
            "loan",
            "obligation"
          ]
        },
        {
          "name": "tokenMint",
          "relations": [
            "loanOffer"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "intializeAcceptLoan",
      "discriminator": [
        16,
        179,
        39,
        48,
        243,
        139,
        69,
        41
      ],
      "accounts": [
        {
          "name": "loanOffer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110,
                  95,
                  111,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "loan_offer.lender",
                "account": "loanOffer"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "loan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "loanOffer"
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "obligation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  98,
                  108,
                  105,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "borrowerTokenAccount",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "loanOffer"
          ]
        },
        {
          "name": "borrower",
          "writable": true,
          "signer": true,
          "relations": [
            "obligation"
          ]
        },
        {
          "name": "tokenMint",
          "relations": [
            "loanOffer"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "loan",
      "discriminator": [
        20,
        195,
        70,
        117,
        165,
        227,
        182,
        1
      ]
    },
    {
      "name": "loanOffer",
      "discriminator": [
        216,
        231,
        124,
        134,
        199,
        190,
        126,
        158
      ]
    },
    {
      "name": "obligation",
      "discriminator": [
        168,
        206,
        141,
        106,
        88,
        76,
        172,
        167
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Loan amount must be greater than zero"
    },
    {
      "code": 6001,
      "name": "invalidInterestRate",
      "msg": "Interest rate must be greater than zero"
    },
    {
      "code": 6002,
      "name": "invalidDuration",
      "msg": "Loan duration must be greater than zero"
    },
    {
      "code": 6003,
      "name": "invalidScore",
      "msg": "Minimum score must be valid (0-1000)"
    },
    {
      "code": 6004,
      "name": "offerNotActive",
      "msg": "Loan offer is not active"
    },
    {
      "code": 6005,
      "name": "insufficientScore",
      "msg": "Borrower score is insufficient"
    },
    {
      "code": 6006,
      "name": "loanOfferExpired",
      "msg": "Loan offer has expired"
    },
    {
      "code": 6007,
      "name": "loanAlreadyRepaid",
      "msg": "Loan already repaid"
    },
    {
      "code": 6008,
      "name": "insufficientRepayment",
      "msg": "Insufficient repayment amount"
    },
    {
      "code": 6009,
      "name": "loanRepaymentOverdue",
      "msg": "Loan repayment overdue it got liquidated"
    },
    {
      "code": 6010,
      "name": "mathOverflow",
      "msg": "Math overflow occurred"
    },
    {
      "code": 6011,
      "name": "loanAlreadyExists",
      "msg": "Borrower already has an active loan."
    }
  ],
  "types": [
    {
      "name": "loan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offer",
            "type": "pubkey"
          },
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "principal",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "repayByTime",
            "type": "i64"
          },
          {
            "name": "isRepaid",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "loanOffer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lender",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "interestRateBps",
            "type": "u16"
          },
          {
            "name": "durationSeconds",
            "type": "u64"
          },
          {
            "name": "minScore",
            "type": "u64"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "obligation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "collateralTokenMint",
            "type": "pubkey"
          },
          {
            "name": "collateralAccount",
            "type": "pubkey"
          },
          {
            "name": "depositedAmount",
            "type": "u64"
          },
          {
            "name": "loanActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
