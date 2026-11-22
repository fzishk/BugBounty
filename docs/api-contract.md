# The Bug Bazaar — API Contract

## Conventions & Core Rules

- **Money & Pricing:** All monetary amounts (`price`, `subtotal`, `total`, `unitPrice`) are stored and transmitted as **integer cents** (for example, `12999` represents `$129.99`) to avoid floating-point rounding bugs.
- **Categories:** Product categories are restricted to `keyboards`, `ducks`, `coffee`, and `stickers`.
- **Sorting (`sort`):** Supported values are `featured`, `price-asc`, `price-desc`, and `rating-desc`.
- **Error Envelope (`ApiError`):** All non-2xx responses return a structured error object:

```json
{
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Mechanical Keycap Set is currently out of stock.",
    "status": 409,
    "details": {
      "productId": "prod-0042",
      "productName": "Mechanical Keycap Set"
    }
  }
}