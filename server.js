const express = require('express');
const cors = require('cors');
const db = require('./config/database');

// Import routes
const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // SQLite constraint errors (e.g., unique constraint)
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      success: false,
      message: 'Data constraint violation',
      error: err.message
    });
  }
  
  // SQLite syntax errors
  if (err.code === 'SQLITE_ERROR') {
    return res.status(400).json({
      success: false,
      message: 'Invalid query',
      error: err.message
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await db.initialize();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   GET    /health - Health check`);
      console.log(`\n   Customers:`);
      console.log(`   POST   /api/customers/search - List customers with filters`);
      console.log(`   GET    /api/customers/:id - Get customer`);
      console.log(`   POST   /api/customers - Create customer`);
      console.log(`   PUT    /api/customers/:id - Update customer`);
      console.log(`   DELETE /api/customers/:id - Delete customer`);
      console.log(`\n   Products:`);
      console.log(`   POST   /api/products/search - List products with filters`);
      console.log(`   GET    /api/products/:id - Get product`);
      console.log(`   POST   /api/products - Create product`);
      console.log(`   PUT    /api/products/:id - Update product`);
      console.log(`   DELETE /api/products/:id - Delete product`);
      console.log(`\n   Orders:`);
      console.log(`   POST   /api/orders/search - List orders with filters`);
      console.log(`   GET    /api/orders/:id - Get order with items`);
      console.log(`   POST   /api/orders - Create order`);
      console.log(`   PUT    /api/orders/:id - Update order`);
      console.log(`   DELETE /api/orders/:id - Delete order`);
      console.log(`   POST   /api/orders/:id/items - Add item to order`);
      console.log(`   GET    /api/orders/:id/items - Get order items`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down server...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nShutting down server...');
  await db.close();
  process.exit(0);
});

startServer();