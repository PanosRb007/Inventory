const express = require('express');

const createemployeeRouter = (pool) => {
  const router = express.Router();

  // Get all employees
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM employees';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving employees:', error);
      res.status(500).json({ error: 'Failed to retrieve employees' });
    }
  });

  // Get a specific employee by empid
  router.get('/:empid', async (req, res) => {
    const { empid } = req.params;
    try {
      const sql = 'SELECT * FROM employees WHERE empid = ?';
      const [results] = await pool.query(sql, [empid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'employee not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving employee:', error);
      res.status(500).json({ error: 'Failed to retrieve employee' });
    }
  });

  // Add a new employee
  router.post('/', async (req, res) => {
    const { name, surname, department, tel, mail, wage } = req.body;
    try {
      const sql = 'INSERT INTO employees (name, surname, department, tel, mail, wage) VALUES (?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [name, surname, department, tel, mail, wage]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding employee:', error);
      res.status(500).json({ error: 'Failed to add employee' });
    }
  });

  // Update an existing employee
  router.put('/:empid', async (req, res) => {
    const { empid } = req.params;
    const { name, surname, department, tel, mail, wage } = req.body;
    try {
      const sql = 'UPDATE employees SET name = ?, surname = ?, department = ?, tel = ?, mail = ?, wage = ? WHERE empid = ?';
      await pool.query(sql, [name, surname, department, tel, mail, wage, empid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ error: 'Failed to update employee' });
    }
  });

  // Delete a employee
  router.delete('/:empid', async (req, res) => {
    const { empid } = req.params;
    try {
      const sql = 'DELETE FROM employees WHERE empid = ?';
      await pool.query(sql, [empid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ error: 'Failed to delete employee' });
    }
  });

  return router;
};

module.exports = createemployeeRouter;

