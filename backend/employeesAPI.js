const express = require('express');

const createemployeeRouter = (pool) => {
  const router = express.Router();

  // Get all employees
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM employees';
      const [results] = await pool.query(sql);
		const employees = results.map(emp => ({
        ...emp,
        active: emp.active ? Boolean(emp.active[0]) : false, // Ensure `active` is boolean
      }));

      // Έλεγχος του ρόλου του χρήστη από το JWT token
      const userRole = req.user.userRole;

      // Αν ο ρόλος είναι 'Senior', αφαιρούμε το πεδίο wage από τα αποτελέσματα
      if (userRole === 'Senior') {
        employees.forEach((employee) => delete employee.wage);
      }

      res.status(200).json(employees);
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
        const userRole = req.user.userRole;
		  const employee = {
        ...results[0],
        active: results[0].active ? Boolean(results[0].active[0]) : false, 
      };

        // Αν ο ρόλος είναι 'Senior', αφαιρούμε το πεδίο wage από το αποτέλεσμα
        if (userRole === 'Senior') {
          delete employee.wage;
        }

        res.status(200).json(employee[0]);
      }
    } catch (error) {
      console.error('Error retrieving employee:', error);
      res.status(500).json({ error: 'Failed to retrieve employee' });
    }
  });

   router.post('/', async (req, res) => {
    const { name, surname, department, tel, mail, wage, active } = req.body;
    try {
      const sql = 'INSERT INTO employees (name, surname, department, tel, mail, wage, active) VALUES (?, ?, ?, ?, ?, ?, ?)';
      const [result] = await pool.query(sql, [name, surname, department, tel, mail, wage, active ? 1 : 0]);

      res.status(201).json({ success: true, empid: result.insertId });
    } catch (error) {
      console.error('Error adding employee:', error);
      res.status(500).json({ error: 'Failed to add employee' });
    }
  });

  // Update an existing employee
  router.put('/:empid', async (req, res) => {
    const { empid } = req.params;
    const { name, surname, department, tel, mail, wage, active } = req.body;
    try {
      const sql = 'UPDATE employees SET name = ?, surname = ?, department = ?, tel = ?, mail = ?, wage = ?, active = ? WHERE empid = ?';
      const [result] = await pool.query(sql, [name, surname, department, tel, mail, wage, active ? 1 : 0, empid]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

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
