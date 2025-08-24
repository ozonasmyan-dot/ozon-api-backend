# Analytics API

## GET /analytics/margin

Retrieves margin statistics grouped by month and SKU.

### Query parameters
- `from` – start date (YYYY-MM-DD)
- `to` – end date (YYYY-MM-DD)
- `sku` – optional SKU filter. May be repeated.

### Response
```
[
  {
    "month": "2024-01",
    "items": [
      {
        "sku": "123",
        "statuses": { "delivered": 10, "cancelled": 2 },
        "totalServices": 100,
        "totalCostPrice": 200,
        "margin": 50
      }
    ]
  }
]
```
Each month's margin value is reduced by the advertising spend for that SKU and month.
