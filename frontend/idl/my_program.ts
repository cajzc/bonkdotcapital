/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/my_program.json`.
 */
export type MyProgram = {
  "address": "2Ay46ZjsCUkFC5CAxQTV5f9Hj8FgoAq6X4bQzWfLM3KS",
  "metadata": {
    "name": "myProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "emitEvent",
      "discriminator": [
        82,
        133,
        188,
        136,
        167,
        139,
        209,
        52
      ],
      "accounts": [
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": []
    },
    {
      "name": "exampleCpi",
      "discriminator": [
        207,
        108,
        176,
        156,
        158,
        22,
        220,
        118
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "counter",
          "writable": true,
          "signer": true
        },
        {
          "name": "exampleProgram",
          "address": "8HupNBr7SBhBLcBsLhbtes3tCarBm6Bvpqp5AfVjHuj8"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "incrementScore",
      "discriminator": [
        3,
        250,
        220,
        149,
        46,
        232,
        135,
        29
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "score",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  99,
                  111,
                  114,
                  101,
                  118,
                  50
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
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
      "accounts": [
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": []
    },
    {
      "name": "initializeNewAccount",
      "discriminator": [
        120,
        204,
        199,
        219,
        44,
        83,
        145,
        253
      ],
      "accounts": [
        {
          "name": "newAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "data",
          "type": "u8"
        }
      ]
    },
    {
      "name": "returnPda",
      "discriminator": [
        219,
        97,
        50,
        237,
        147,
        175,
        88,
        63
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "pdaAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  101,
                  108,
                  108,
                  111,
                  95,
                  119,
                  111,
                  114,
                  108,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "solTransfer",
      "discriminator": [
        135,
        254,
        247,
        202,
        217,
        48,
        184,
        165
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
      "name": "newAccount",
      "discriminator": [
        176,
        95,
        4,
        118,
        91,
        177,
        125,
        232
      ]
    },
    {
      "name": "scoreAccount",
      "discriminator": [
        97,
        121,
        23,
        147,
        120,
        45,
        149,
        84
      ]
    }
  ],
  "events": [
    {
      "name": "exampleEvent",
      "discriminator": [
        106,
        216,
        53,
        133,
        46,
        98,
        236,
        159
      ]
    }
  ],
  "types": [
    {
      "name": "exampleEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "message",
            "type": "string"
          },
          {
            "name": "value",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "newAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "data",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "scoreAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "score",
            "type": "u128"
          },
          {
            "name": "loans",
            "type": "u64"
          },
          {
            "name": "borrows",
            "type": "u64"
          },
          {
            "name": "activeLoans",
            "type": "u64"
          },
          {
            "name": "activeBorrows",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u64",
                32
              ]
            }
          }
        ]
      }
    }
  ]
};
