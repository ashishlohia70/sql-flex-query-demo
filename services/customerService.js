const { buildQueries, dialectHelpers } = require('sql-flex-query');
const db = require('../config/databaseHelper');
const config = require('../config/appConfig');

class CustomerService {
  constructor() {
    this.dialect = config.dialect;
  }

  async getCustomers(queryConfig = {}) {
    const BASE = `
      SELECT /*SELECT_COLUMNS*/
      FROM customers
      /*WHERE_CLAUSE*/
      /*ORDER_BY*/
      /*LIMIT_CLAUSE*/
    `;

    // Use client-provided configuration with defaults
    const {
      selectColumns = ['id', 'name', 'email', 'status', 'created_at'],
      whereParams = [],
      textSearchParams = [],
      sortBy = [{ key: 'id', direction: 'DESC' }],
      page = 1,
      size = 10,
      columnMapper = {}
    } = queryConfig;

    const result = buildQueries({
      baseQueryTemplate: BASE,
      whereParams,
      textSearchParams,
      sortBy,
      page: parseInt(page),
      size: parseInt(size),
      columnMapper,
      selectColumns,
      dialect: this.dialect
    });

    const rows = await db.all(result.searchQuery, result.params);
    const countResult = await db.get(result.countQuery, result.params);
    
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
    
    return await db.get(query, [id]);
  }

  async createCustomer(customerData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { name: 'name', email: 'email', status: 'status' };
    
    const { columns, placeholders, params } = h.buildInsertValues(customerData, columnMapper);
    
    const query = `INSERT INTO customers (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    
    await db.run(query, params);
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
      db.run(query, params, function(err) {
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
      db.run(query, params, function(err) {
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