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
      "name": "createLoan",
      "discriminator": [
        166,
        131,
        118,
        219,
        138,
        218,
        206,
        140
      ],
      "accounts": [
        {
          "name": "loanInfo",
          "docs": [
            "Stores metadata about the loan info"
          ],
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
                  105,
                  110,
                  102,
                  111
                ]
              },
              {
                "kind": "account",
                "path": "lender"
              },
              {
                "kind": "account",
                "path": "loanTokenMint"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Holds the tokens sent out for a loan prior to a second party borrowing"
          ],
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
                "path": "loanInfo"
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
          "name": "loanTokenMint"
        },
        {
          "name": "acceptedTokenMint"
        },
        {
          "name": "tokenProgram"
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
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Testing purposes"
      ],
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
      "name": "payLoan",
      "discriminator": [
        238,
        200,
        76,
        184,
        218,
        195,
        214,
        11
      ],
      "accounts": [
        {
          "name": "openLoan",
          "docs": [
            "State of the loan taken by a borrower"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "loanInfo"
              },
              {
                "kind": "account",
                "path": "borrower"
              }
            ]
          }
        },
        {
          "name": "loanInfo",
          "docs": [
            "Stores metadata about the loan info"
          ],
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
                  105,
                  110,
                  102,
                  111
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
          "name": "collateralVault",
          "docs": [
            "Stores the collateral token and metadata"
          ],
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
                "path": "loanInfo"
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
          "name": "lenderTokenAccount",
          "writable": true
        },
        {
          "name": "borrower",
          "writable": true,
          "signer": true
        },
        {
          "name": "lender"
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "takeLoan",
      "discriminator": [
        153,
        53,
        51,
        59,
        222,
        102,
        52,
        131
      ],
      "accounts": [
        {
          "name": "openLoan",
          "docs": [
            "State of the loan taken by a borrower"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  110,
                  95,
                  108,
                  111,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "loanInfo"
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
          "docs": [
            "Stores the collateral token and metadata"
          ],
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
                "path": "loanInfo"
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "borrower"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vault",
          "docs": [
            "Holds the tokens sent out for a loan prior to a second party borrowing"
          ],
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
                "path": "loanInfo"
              }
            ]
          }
        },
        {
          "name": "loanInfo",
          "docs": [
            "Stores metadata about the loan info"
          ],
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
                  105,
                  110,
                  102,
                  111
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
          "name": "borrower",
          "writable": true,
          "signer": true,
          "relations": [
            "collateralVault"
          ]
        },
        {
          "name": "lender"
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "collateralVault",
      "discriminator": [
        19,
        189,
        95,
        155,
        100,
        9,
        159,
        145
      ]
    },
    {
      "name": "loanInfo",
      "discriminator": [
        177,
        123,
        190,
        7,
        82,
        223,
        152,
        75
      ]
    },
    {
      "name": "openLoan",
      "discriminator": [
        22,
        159,
        20,
        234,
        213,
        238,
        82,
        86
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
      "name": "collateralNotEnough",
      "msg": "Not enough tokens for collateral"
    },
    {
      "code": 6002,
      "name": "invalidInterestRate",
      "msg": "Interest rate must be greater than zero"
    },
    {
      "code": 6003,
      "name": "invalidDuration",
      "msg": "Loan duration must be greater than zero"
    },
    {
      "code": 6004,
      "name": "invalidScore",
      "msg": "Minimum score must be valid (0-1000)"
    },
    {
      "code": 6005,
      "name": "offerNotActive",
      "msg": "Loan offer is not active"
    },
    {
      "code": 6006,
      "name": "insufficientScore",
      "msg": "Borrower score is insufficient"
    },
    {
      "code": 6007,
      "name": "loanOfferExpired",
      "msg": "Loan offer has expired"
    },
    {
      "code": 6008,
      "name": "loanAlreadyRepaid",
      "msg": "Loan already repaid"
    },
    {
      "code": 6009,
      "name": "insufficientRepayment",
      "msg": "Insufficient repayment amount"
    },
    {
      "code": 6010,
      "name": "loanRepaymentOverdue",
      "msg": "Loan repayment overdue it got liquidated"
    },
    {
      "code": 6011,
      "name": "mathOverflow",
      "msg": "Math overflow occurred"
    },
    {
      "code": 6012,
      "name": "loanAlreadyExists",
      "msg": "Borrower already has an active loan."
    }
  ],
  "types": [
    {
      "name": "collateralVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "loanInfo",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
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
      "name": "loanInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lender",
            "type": "pubkey"
          },
          {
            "name": "loanTokenMint",
            "type": "pubkey"
          },
          {
            "name": "acceptedTokenMint",
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
      "name": "openLoan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "loanInfo",
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
    }
  ]
};
