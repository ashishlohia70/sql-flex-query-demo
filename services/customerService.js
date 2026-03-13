const { buildQueries, dialectHelpers } = require('sql-flex-query');
const db = require('../config/database');

class CustomerService {
  constructor() {
    this.dialect = 'sqlite';
  }

  async getCustomers(filters = {}, page = 1, size = 10) {
    const BASE = `
      SELECT /*SELECT_COLUMNS*/
      FROM customers
      /*WHERE_CLAUSE*/
      /*ORDER_BY*/
      /*LIMIT_CLAUSE*/
    `;

    const whereParams = [];
    
    // Build WHERE conditions from filters
    if (filters.status) {
      whereParams.push({ key: 'status', operation: 'EQ', value: filters.status });
    }
    if (filters.name) {
      whereParams.push({ key: 'name', operation: 'LIKE', value: `%${filters.name}%` });
    }
    if (filters.email) {
      whereParams.push({ key: 'email', operation: 'LIKE', value: `%${filters.email}%` });
    }

    const result = buildQueries({
      baseQueryTemplate: BASE,
      whereParams,
      textSearchParams: [],
      sortBy: filters.sortBy ? [{ key: filters.sortBy, direction: filters.sortDir || 'ASC' }] : [{ key: 'id', direction: 'DESC' }],
      page: parseInt(page),
      size: parseInt(size),
      columnMapper: {},
      selectColumns: ['id', 'name', 'email', 'status', 'created_at'],
      dialect: this.dialect
    });

    const {rows} = await db.getDb().all(result.searchQuery, result.params);
    const [countResult] = await db.getDb().get(result.countQuery, result.params);
    
    return {
      data: rows,
      total: countResult.count,
      page: parseInt(page),
      size: parseInt(size),
      totalPages: Math.ceil(countResult.count / size)
    };
  }

  async getCustomerById(id) {
    const query = `
      SELECT id, name, email, status, created_at
      FROM customers
      WHERE id = ?
    `;
    
    return await db.getDb().get(query, [id]);
  }

  async createCustomer(customerData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { name: 'name', email: 'email', status: 'status' };
    
    const { columns, placeholders, params } = h.buildInsertValues(customerData, columnMapper);
    
    const query = `INSERT INTO customers (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...customerData });
        }
      });
    });
  }

  async updateCustomer(id, customerData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { name: 'name', email: 'email', status: 'status' };
    
    const { setClause, params } = h.buildSetClause(customerData, columnMapper);
    
    const { clause } = h.buildWhereClause(
      [{ key: 'id', operation: 'EQ', value: id }],
      [],
      columnMapper,
      params
    );
    
    const query = `UPDATE customers SET ${setClause}${clause}`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...customerData });
        }
      });
    });
  }

  async deleteCustomer(id) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { id: 'id' };
    
    const { clause, params } = h.buildWhereClause(
      [{ key: 'id', operation: 'EQ', value: id }],
      [],
      columnMapper
    );
    
    const query = `DELETE FROM customers${clause}`;
    
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
}

module.exports = new CustomerService();