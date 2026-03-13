const { buildQueries, QueryBuilder, dialectHelpers } = require('sql-flex-query');
const db = require('../config/database');

class OrderService {
  constructor() {
    this.dialect = 'sqlite';
  }

  async getOrders(filters = {}, page = 1, size = 10) {
    const BASE = `
      SELECT /*SELECT_COLUMNS*/
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      /*WHERE_CLAUSE*/
      /*ORDER_BY*/
      /*LIMIT_CLAUSE*/
    `;

    const whereParams = [];
    
    // Build WHERE conditions from filters
    if (filters.status) {
      whereParams.push({ key: 'o.status', operation: 'EQ', value: filters.status });
    }
    if (filters.customerId) {
      whereParams.push({ key: 'o.customer_id', operation: 'EQ', value: parseInt(filters.customerId) });
    }
    if (filters.minDate) {
      whereParams.push({ key: 'o.order_date', operation: 'GTE', value: filters.minDate });
    }
    if (filters.maxDate) {
      whereParams.push({ key: 'o.order_date', operation: 'LTE', value: filters.maxDate });
    }

    const columnMapper = {
      orderId: 'o.id',
      orderDate: 'o.order_date',
      orderStatus: 'o.status',
      totalAmount: 'o.total_amount',
      customerId: 'c.id',
      customerName: 'c.name',
      customerEmail: 'c.email'
    };

    const result = buildQueries({
      baseQueryTemplate: BASE,
      columnMapper,
      selectColumns: [
        'orderId',
        'orderDate',
        'orderStatus',
        'totalAmount',
        'customerId',
        'customerName',
        'customerEmail'
      ],
      whereParams,
      textSearchParams: [],
      sortBy: filters.sortBy ? [{ key: filters.sortBy, direction: filters.sortDir || 'ASC' }] : [{ key: 'o.id', direction: 'DESC' }],
      page: parseInt(page),
      size: parseInt(size),
      dialect: this.dialect
    });

    const [rows] = await db.getDb().all(result.searchQuery, result.params);
    const [countResult] = await db.getDb().get(result.countQuery, result.params);
    
    return {
      data: rows,
      total: countResult.count,
      page: parseInt(page),
      size: parseInt(size),
      totalPages: Math.ceil(countResult.count / size)
    };
  }

  async getOrderById(id) {
    const query = `
      SELECT 
        o.id as orderId,
        o.order_date as orderDate,
        o.status as orderStatus,
        o.total_amount as totalAmount,
        c.id as customerId,
        c.name as customerName,
        c.email as customerEmail
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.id = ?
    `;
    
    return await db.getDb().get(query, [id]);
  }

  async getOrderWithItems(id) {
    const query = `
      SELECT 
        o.id as orderId,
        o.order_date as orderDate,
        o.status as orderStatus,
        o.total_amount as totalAmount,
        c.id as customerId,
        c.name as customerName,
        c.email as customerEmail,
        oi.id as orderItemId,
        oi.product_id as productId,
        oi.quantity as quantity,
        oi.unit_price as unitPrice,
        oi.total_price as totalPrice,
        p.name as productName
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = ?
      ORDER BY oi.id
    `;
    
    const rows = await db.getDb().all(query, [id]);
    
    if (rows.length === 0) return null;
    
    // Group order items
    const order = {
      orderId: rows[0].orderId,
      orderDate: rows[0].orderDate,
      orderStatus: rows[0].orderStatus,
      totalAmount: rows[0].totalAmount,
      customer: {
        id: rows[0].customerId,
        name: rows[0].customerName,
        email: rows[0].customerEmail
      },
      items: []
    };
    
    rows.forEach(row => {
      if (row.orderItemId) {
        order.items.push({
          orderItemId: row.orderItemId,
          productId: row.productId,
          productName: row.productName,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          totalPrice: row.totalPrice
        });
      }
    });
    
    return order;
  }

  async createOrder(orderData) {
    const h = dialectHelpers(this.dialect);
    const orderColumnMapper = { 
      customer_id: 'customer_id', 
      status: 'status', 
      total_amount: 'total_amount' 
    };
    
    const { columns, placeholders, params } = h.buildInsertValues(orderData, orderColumnMapper);
    
    const query = `INSERT INTO orders (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ orderId: this.lastID, ...orderData });
        }
      });
    });
  }

  async updateOrder(id, orderData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { status: 'status', total_amount: 'total_amount' };
    
    const { setClause, params } = h.buildSetClause(orderData, columnMapper);
    
    const { clause } = h.buildWhereClause(
      [{ key: 'id', operation: 'EQ', value: id }],
      [],
      columnMapper,
      params
    );
    
    const query = `UPDATE orders SET ${setClause}${clause}`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ orderId: id, ...orderData });
        }
      });
    });
  }

  async deleteOrder(id) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { id: 'id' };
    
    const { clause, params } = h.buildWhereClause(
      [{ key: 'id', operation: 'EQ', value: id }],
      [],
      columnMapper
    );
    
    const query = `DELETE FROM orders${clause}`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }

  async addOrderItem(orderId, productId, quantity, unitPrice) {
    const h = dialectHelpers(this.dialect);
    const orderItemData = {
      order_id: orderId,
      product_id: productId,
      quantity: quantity,
      unit_price: unitPrice
    };
    
    const columnMapper = { 
      order_id: 'order_id', 
      product_id: 'product_id', 
      quantity: 'quantity', 
      unit_price: 'unit_price' 
    };
    
    const { columns, placeholders, params } = h.buildInsertValues(orderItemData, columnMapper);
    
    const query = `INSERT INTO order_items (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ orderItemId: this.lastID, orderId, productId, quantity, unitPrice });
        }
      });
    });
  }

  async getOrderItems(orderId) {
    const query = `
      SELECT 
        oi.id as orderItemId,
        oi.order_id as orderId,
        oi.product_id as productId,
        oi.quantity as quantity,
        oi.unit_price as unitPrice,
        oi.total_price as totalPrice,
        p.name as productName
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;
    
    return await db.getDb().all(query, [orderId]);
  }
}

module.exports = new OrderService();