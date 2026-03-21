# SQL Flex Query Demo

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A production-ready REST API demo showcasing the powerful **sql-flex-query** library for building dynamic, flexible SQL queries in Node.js applications. This project demonstrates best practices in database abstraction, query building, and RESTful API design.

## Features

### Core Capabilities
- **Flexible Query Building** - Dynamic WHERE clauses, sorting, and pagination using `sql-flex-query`
- **Full CRUD Operations** - Complete Create, Read, Update, Delete for Customers, Products, and Orders
- **Advanced Search** - POST-based search endpoints with complex filtering and text search
- **Pagination** - Built-in pagination with total count and page metadata
- **Transaction Support** - Safe multi-operation transactions for order creation
- **Error Handling** - Comprehensive error handling for SQLite constraints and syntax errors
- **Health Checks** - `/health` endpoint for monitoring and uptime checks
- **Graceful Shutdown** - Proper database connection cleanup on SIGINT/SIGTERM

### Database Features
- SQLite with sample e-commerce data
- Foreign key relationships (Orders → Customers, Order Items → Orders/Products)
- Computed columns (order_items.total_price = quantity × unit_price)
- Sample data for testing and development

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5.2.1 | Web Framework |
| SQLite3 | 6.0.1 | Database |
| sql-flex-query | 1.0.3 | Query Builder |
| CORS | 2.8.6 | Cross-Origin Support |

## Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sql-flex-query-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   The database auto-initializes on first run using `database.sql`. No manual setup required.

## Project Structure

```
sql-flex-query-demo/
├── config/
│   ├── appConfig.js          # Application configuration (dialect)
│   ├── database.js           # Database connection & initialization
│   └── databaseHelper.js     # Database helper methods (all, get, run, transaction)
├── routes/
│   ├── customers.js          # Customer routes
│   ├── products.js           # Product routes
│   └── orders.js             # Order routes (with items)
├── services/
│   ├── customerService.js    # Customer business logic with sql-flex-query
│   ├── productService.js     # Product business logic with sql-flex-query
│   └── orderService.js       # Order business logic with sql-flex-query
├── database.sql              # Schema & sample data
├── server.js                 # Express app & server setup
├── postman-collection.json   # Postman collection for API testing
├── package.json              # Dependencies & scripts
└── README.md                 # This file
```

## Running the Application

### Development Mode
```bash
npm start
# or
npm run dev
```

The server will start on `http://localhost:3000` (or `PORT` environment variable).

### Demo Script
```bash
npm run demo
```

### Production Mode
```bash
PORT=8080 npm start
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-03-21T09:47:00.000Z"
}
```

---

## Customers API

### List Customers with Filters
```http
POST /api/customers/search
Content-Type: application/json
```

**Request Body (all optional):**
```json
{
  "selectColumns": ["id", "name", "email", "status", "created_at"],
  "whereParams": [
    { "key": "status", "operation": "EQ", "value": "ACTIVE" }
  ],
  "textSearchParams": [
    { "key": "name", "value": "john" }
  ],
  "sortBy": [
    { "key": "id", "direction": "DESC" }
  ],
  "page": 1,
  "size": 10,
  "columnMapper": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "status": "ACTIVE",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

### Get Customer by ID
```http
GET /api/customers/:id
```

### Create Customer
```http
POST /api/customers
Content-Type: application/json
```
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "status": "ACTIVE"
}
```

### Update Customer
```http
PUT /api/customers/:id
Content-Type: application/json
```
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "status": "INACTIVE"
}
```

### Delete Customer
```http
DELETE /api/customers/:id
```

---

## Products API

### List Products with Filters
```http
POST /api/products/search
Content-Type: application/json
```

**Request Body (all optional):**
```json
{
  "selectColumns": ["id", "name", "description", "price", "status", "created_at"],
  "whereParams": [
    { "key": "price", "operation": "GT", "value": 100 }
  ],
  "textSearchParams": [
    { "key": "name", "value": "laptop" }
  ],
  "sortBy": [
    { "key": "price", "direction": "ASC" }
  ],
  "page": 1,
  "size": 10
}
```

### Get Product by ID
```http
GET /api/products/:id
```

### Create Product
```http
POST /api/products
Content-Type: application/json
```
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 1200.00,
  "status": "ACTIVE"
}
```

### Update Product
```http
PUT /api/products/:id
Content-Type: application/json
```
```json
{
  "name": "Gaming Laptop",
  "price": 1499.99
}
```

### Delete Product
```http
DELETE /api/products/:id
```

---

## Orders API

### List Orders with Filters
```http
POST /api/orders/search
Content-Type: application/json
```

**Request Body (all optional):**
```json
{
  "selectColumns": [
    "orderId",
    "orderDate",
    "orderStatus",
    "totalAmount",
    "customerId",
    "customerName",
    "customerEmail"
  ],
  "whereParams": [
    { "key": "orderStatus", "operation": "EQ", "value": "PENDING" }
  ],
  "textSearchParams": [
    { "key": "customerName", "value": "john" }
  ],
  "sortBy": [
    { "key": "o.id", "direction": "DESC" }
  ],
  "page": 1,
  "size": 10
}
```

### Get Order with Items
```http
GET /api/orders/:id
```
Returns order details with nested items array.

### Create Order
```http
POST /api/orders
Content-Type: application/json
```
```json
{
  "customer_id": 1,
  "status": "PENDING",
  "total_amount": 1250.00,
  "items": [
    {
      "product_id": 1,
      "quantity": 1,
      "unit_price": 1200.00
    },
    {
      "product_id": 2,
      "quantity": 2,
      "unit_price": 25.00
    }
  ]
}
```

### Update Order
```http
PUT /api/orders/:id
Content-Type: application/json
```
```json
{
  "status": "SHIPPED",
  "total_amount": 1500.00
}
```

### Delete Order
```http
DELETE /api/orders/:id
```

### Add Item to Order
```http
POST /api/orders/:id/items
Content-Type: application/json
```
```json
{
  "product_id": 3,
  "quantity": 1,
  "unit_price": 75.00
}
```

### Get Order Items
```http
GET /api/orders/:id/items
```

---

## Flexible Query Configuration

The `sql-flex-query` library enables dynamic query building with these parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `selectColumns` | `string[]` | Columns to SELECT (default: all) |
| `whereParams` | `Array<{key, operation, value}>` | Filter conditions (EQ, NE, GT, LT, GTE, LTE, LIKE, IN, etc.) |
| `textSearchParams` | `Array<{key, value}>` | Full-text search across specified columns |
| `sortBy` | `Array<{key, direction}>` | ORDER BY clauses (direction: ASC/DESC) |
| `page` | `number` | Page number (default: 1) |
| `size` | `number` | Page size (default: 10) |
| `columnMapper` | `Object` | Maps logical names to actual column names |

### Example: Complex Query
```json
{
  "selectColumns": ["id", "name", "email", "status"],
  "whereParams": [
    { "key": "status", "operation": "EQ", "value": "ACTIVE" },
    { "key": "id", "operation": "GT", "value": 0 }
  ],
  "textSearchParams": [
    { "key": "name", "value": "john" },
    { "key": "email", "value": "example.com" }
  ],
  "sortBy": [
    { "key": "id", "direction": "DESC" }
  ],
  "page": 1,
  "size": 20
}
```

---

## Database Schema

### Tables
- **customers** - Customer information (id, name, email, status)
- **products** - Product catalog (id, name, description, price, status)
- **orders** - Order headers (id, customer_id, order_date, status, total_amount)
- **order_items** - Order line items (id, order_id, product_id, quantity, unit_price, total_price)

### Relationships
- `orders.customer_id` → `customers.id` (Foreign Key)
- `order_items.order_id` → `orders.id` (Foreign Key)
- `order_items.product_id` → `products.id` (Foreign Key)

### Sample Data
The `database.sql` file includes 5 customers, 5 products, 6 orders, and 7 order items for testing.

---

## Testing with Postman

1. Import `postman-collection.json` into Postman
2. Set the environment variable `baseUrl` to `http://localhost:3000`
3. Run the collection to test all endpoints

---

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

**SQLite-Specific Errors:**
- `SQLITE_CONSTRAINT` - Data constraint violation (unique, foreign key, etc.)
- `SQLITE_ERROR` - Invalid SQL syntax

---

## Graceful Shutdown

The server handles termination signals properly:
- `SIGINT` (Ctrl+C) - Closes database connection before exit
- `SIGTERM` (Docker/K8s shutdown) - Same graceful cleanup

---

## Configuration

Edit `config/appConfig.js` to change the database dialect:
```javascript
module.exports = {
  dialect: 'sqlite' // or 'mysql', 'postgresql', etc.
};
```

---

## Development Tips

### View SQL Queries
The `databaseHelper.js` logs all queries to console. Useful for debugging:
```javascript
// In databaseHelper.js
console.log(query, params); // Line 12 & 49
```

### Add New Endpoints
1. Add route in `routes/` directory
2. Implement service method in `services/` directory using `sql-flex-query`
3. Register route in `server.js`

### Reset Database
Delete `my_database.db` and restart the server. The schema will be recreated.

---

## Performance Considerations

- **Pagination** - Always use pagination (`page`/`size`) for large datasets
- **Select Columns** - Request only needed columns via `selectColumns`
- **Indexes** - Add database indexes for frequently queried columns
- **Connection Pooling** - For production, consider connection pooling

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

---

## License

MIT License - see LICENSE file for details.

---

## Acknowledgments

- [sql-flex-query](https://www.npmjs.com/package/sql-flex-query) - The powerful query builder library
- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework
- [SQLite](https://www.sqlite.org/) - Self-contained, serverless database

---

**Made with ❤️ using Node.js, Express, and sql-flex-query**
