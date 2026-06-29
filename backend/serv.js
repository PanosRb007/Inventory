const express = require('express');
const sanitizeHtml = require('sanitize-html');

const projectWebhook = (pool) => {
  const router = express.Router();

  // Webhook endpoint to add a new project
  router.post('/', async (req, res) => {
    console.log('Received payload:', req.body);

    const { name, description, amount } = req.body;

    // Έλεγχος αν το πεδίο name υπάρχει
    if (!name) {
      return res.status(400).json({ error: 'Missing required fields: name' });
    }

    // Καθαρισμός του description από HTML tags
    const cleanDescription = sanitizeHtml(description, {
      allowedTags: [],          // Δεν επιτρέπεται κανένα HTML tag
      allowedAttributes: {}     // Δεν επιτρέπονται attributes
    });

    // Μετατροπή του amount σε δεκαδικό αριθμό
    const sale = parseFloat(amount);

    try {
      // Εισαγωγή δεδομένων στον πίνακα projects
      const sql = 'INSERT INTO projects (name, description, sale) VALUES (?, ?, ?)';
      await pool.query(sql, [name, cleanDescription, sale]);

      res.status(200).json({ success: true, message: 'Project added successfully' });
    } catch (error) {
      console.error('Error adding project:', error);
      res.status(500).json({ error: 'Failed to add project' });
    }
  });

  return router;
};

module.exports = projectWebhook;

const express = require('express');

const createEmployeeRouter = (pool) => {
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
        res.status(404).json({ error: 'Employee not found' });
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
    const { name, surname, department, tel, mail, wage, active = 1 } = req.body;
    try {
      const sql = 'INSERT INTO employees (name, surname, department, tel, mail, wage, active) VALUES (?, ?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [name, surname, department, tel, mail, wage, active]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding employee:', error);
      res.status(500).json({ error: 'Failed to add employee', details: error.message });
    }
  });

  // Update an existing employee
  router.put('/:empid', async (req, res) => {
    const { empid } = req.params;
    const { name, surname, department, tel, mail, wage, active } = req.body;
    try {
      const sql = 'UPDATE employees SET name = ?, surname = ?, department = ?, tel = ?, mail = ?, wage = ?, active = ? WHERE empid = ?';
      await pool.query(sql, [name, surname, department, tel, mail, wage, active, empid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ error: 'Failed to update employee', details: error.message });
    }
  });

  // Delete an employee
  router.delete('/:empid', async (req, res) => {
    const { empid } = req.params;
    try {
      const sql = 'DELETE FROM employees WHERE empid = ?';
      await pool.query(sql, [empid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ error: 'Failed to delete employee', details: error.message });
    }
  });

  return router;
};

module.exports = createEmployeeRouter;

