# Reporting API Documentation

## Overview

The Reporting module provides 8 read-only endpoints that aggregate data from existing entities (POS, Finance, Inventory, Production). No new database tables are created — all reports use TypeORM QueryBuilder with `getRawMany()` aggregations.

**Base URL:** `api/v1/reports`
**Authentication:** JWT Bearer token required on all endpoints
**Authorization:** Role-based access per endpoint (see table below)

---

## Common Query Parameters

All endpoints accept these optional query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | ISO date string | Start of date range (e.g., `2026-01-01`) |
| `endDate` | ISO date string | End of date range (e.g., `2026-03-01`) |
| `locationId` | UUID string | Filter by location |

---

## Endpoints

### 1. Sales Summary

```
GET /api/v1/reports/sales/summary
```

**Roles:** `owner`, `manager`, `accountant`

**Additional Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `groupBy` | `day` \| `week` \| `month` | `day` | Period grouping via `DATE_TRUNC` |

**Response:**
```json
[
  {
    "period": "2026-03-01T00:00:00.000Z",
    "orderCount": "42",
    "revenue": "125000.00",
    "avgCheck": "2976.19"
  }
]
```

---

### 2. Top Products

```
GET /api/v1/reports/sales/top-products
```

**Roles:** `owner`, `manager`

**Response:** Top 20 products by revenue, with category information.
```json
[
  {
    "productId": "uuid",
    "productName": "Croissant",
    "categoryName": "Pastry",
    "totalQuantity": "150",
    "totalRevenue": "22500.00"
  }
]
```

---

### 3. Sales by Category

```
GET /api/v1/reports/sales/by-category
```

**Roles:** `owner`, `manager`

**Response:**
```json
[
  {
    "categoryId": "uuid",
    "categoryName": "Bread",
    "totalQuantity": "300",
    "totalRevenue": "45000.00"
  }
]
```

---

### 4. Payment Methods

```
GET /api/v1/reports/sales/payment-methods
```

**Roles:** `owner`, `manager`, `accountant`

**Response:**
```json
[
  { "method": "cash", "count": "85", "total": "95000.00" },
  { "method": "card", "count": "120", "total": "145000.00" }
]
```

---

### 5. Finance Summary (P&L)

```
GET /api/v1/reports/finance/summary
```

**Roles:** `owner`, `accountant`

**Response:**
```json
{
  "breakdown": [
    { "type": "revenue", "category": "sales", "total": "250000.00" },
    { "type": "expense", "category": "ingredients", "total": "-80000.00" }
  ],
  "totalRevenue": 250000,
  "totalExpenses": 80000,
  "netProfit": 170000,
  "margin": 68
}
```

---

### 6. Inventory Status

```
GET /api/v1/reports/inventory/status
```

**Roles:** `owner`, `manager`, `chef`, `warehouse`

**Response:**
```json
{
  "stockLevels": [
    {
      "id": "uuid",
      "ingredientName": "Flour",
      "unit": "kg",
      "minStockLevel": "50.00",
      "quantity": "120.00",
      "status": "in_stock",
      "locationName": "Main Kitchen"
    }
  ],
  "statusSummary": [
    { "status": "in_stock", "count": "25" },
    { "status": "low_stock", "count": "3" }
  ],
  "expiringBatches": [
    {
      "id": "uuid",
      "ingredientName": "Butter",
      "batchNumber": "B-2026-001",
      "quantity": "10.00",
      "expiresAt": "2026-03-08T00:00:00.000Z"
    }
  ]
}
```

---

### 7. Inventory Movements

```
GET /api/v1/reports/inventory/movements
```

**Roles:** `owner`, `manager`, `chef`, `warehouse`

**Response:**
```json
{
  "byType": [
    { "type": "delivery", "count": "15", "totalQuantity": "500.00", "totalCost": "75000.00" },
    { "type": "write_off", "count": "3", "totalQuantity": "12.00", "totalCost": "0.00" }
  ],
  "byIngredient": [
    {
      "ingredientId": "uuid",
      "ingredientName": "Flour",
      "type": "delivery",
      "totalQuantity": "200.00"
    }
  ]
}
```

---

### 8. Production Summary

```
GET /api/v1/reports/production/summary
```

**Roles:** `owner`, `manager`, `chef`

**Response:**
```json
{
  "plansByStatus": [
    { "status": "completed", "count": "10" },
    { "status": "in_progress", "count": "2" }
  ],
  "byRecipe": [
    {
      "recipeName": "Sourdough Bread",
      "recipeId": "uuid",
      "taskCount": "8",
      "totalPlanned": "200",
      "totalYield": "185",
      "totalWaste": "15"
    }
  ]
}
```

---

## Data Sources

| Report | Entities Used |
|--------|--------------|
| Sales Summary | `Order` |
| Top Products | `OrderItem`, `Order`, `Product`, `Category` |
| Sales by Category | `OrderItem`, `Order`, `Product`, `Category` |
| Payment Methods | `Payment`, `Order` |
| Finance Summary | `FinanceTransaction` |
| Inventory Status | `InventoryItem`, `Ingredient`, `InventoryBatch` |
| Inventory Movements | `InventoryMovement`, `Ingredient` |
| Production Summary | `ProductionPlan`, `ProductionTask` |

## Swagger

All endpoints are documented via Swagger at `http://localhost:3000/api/docs` under the **Reports** tag.
