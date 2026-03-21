const db = require('./database');

class DatabaseHelper {
  /**
   * Execute a query that returns multiple rows
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - Array of rows
   */
  async all(query, params = []) {
    return new Promise((resolve, reject) => {
      console.log(query, params);
      db.getDb().all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Execute a query that returns a single row
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} - Single row or null
   */
  async get(query, params = []) {
    return new Promise((resolve, reject) => {
      db.getDb().get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} - Result with lastID and changes
   */
  async run(query, params = []) {
    return new Promise((resolve, reject) => {
      console.log(query, params);
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Array<{query: string, params: Array}>} operations - Array of operations
   * @returns {Promise<void>}
   */
  async transaction(operations) {
    return new Promise((resolve, reject) => {
      db.getDb().serialize(() => {
        db.getDb().run('BEGIN TRANSACTION', (err) => {
          if (err) {
            return reject(err);
          }

          let operationIndex = 0;
          let transactionError = null;

          const executeNext = () => {
            if (transactionError) {
              return db.getDb().run('ROLLBACK', () => resolve());
            }

            if (operationIndex >= operations.length) {
              return db.getDb().run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }

            const { query, params } = operations[operationIndex];
            db.getDb().run(query, params || [], function(err) {
              if (err) {
                transactionError = err;
                db.getDb().run('ROLLBACK', () => {});
                return executeNext();
              }
              operationIndex++;
              executeNext();
            });
          };

          executeNext();
        });
      });
    });
  }
}

module.exports = new DatabaseHelper();