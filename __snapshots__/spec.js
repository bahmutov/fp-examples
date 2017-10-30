exports['works in different situations multiplyBy 1'] = {
  "name": "multiplyBy",
  "behavior": [
    {
      "given": [
        2,
        []
      ],
      "expect": []
    },
    {
      "given": [
        10,
        [
          1
        ]
      ],
      "expect": [
        10
      ]
    },
    {
      "given": [
        2,
        [
          3,
          1,
          7
        ]
      ],
      "expect": [
        6,
        2,
        14
      ]
    },
    {
      "given": [
        -1,
        [
          0,
          1,
          2,
          3
        ]
      ],
      "expect": [
        0,
        -1,
        -2,
        -3
      ]
    }
  ]
}
