const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // GET all events with categories, employees, and locations
  router.get('/', async (req, res) => {
    try {
      const eventsResult = await pool.query('SELECT * FROM calendar_events');
      const events = eventsResult[0];
      const eventIds = events.map(e => e.id);

      if (eventIds.length === 0) return res.json([]);

      const [categoriesResult] = await pool.query(
        `SELECT ec.event_id, jc.name AS category 
         FROM event_categories ec 
         JOIN job_categories jc ON ec.category_id = jc.id 
         WHERE ec.event_id IN (?)`, [eventIds]
      );

      const [employeesResult] = await pool.query(
        `SELECT ee.event_id, e.empid, e.name 
         FROM event_employees ee 
         JOIN employees e ON ee.employee_id = e.empid 
         WHERE ee.event_id IN (?)`, [eventIds]
      );

      const [locationsResult] = await pool.query(
        `SELECT el.event_id, jl.name AS location 
         FROM event_locations el 
         JOIN job_locations jl ON el.location_id = jl.id 
         WHERE el.event_id IN (?)`, [eventIds]
      );

      const enriched = events.map(event => {
        const categories = categoriesResult.filter(row => row.event_id === event.id).map(row => row.category);
        const employees = employeesResult.filter(row => row.event_id === event.id).map(row => ({ id: row.empid, name: row.name }));
        const locations = locationsResult.filter(row => row.event_id === event.id).map(row => row.location);

        return { ...event, categories, employees, locations };
      });

      res.json(enriched);
    } catch (err) {
      console.error('GET /calendar_eventsAPI error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // POST create new event
  router.post('/', async (req, res) => {
    const { prid, title, start, end, color, categories } = req.body;

    if (!prid || !title || !start) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO calendar_events (prid, title, start, end, color) VALUES (?, ?, ?, ?, ?)',
        [prid, title, start, end || null, color || '#ccc']
      );
      const eventId = result.insertId;

      if (Array.isArray(categories) && categories.length > 0) {
        const categoryIds = await Promise.all(categories.map(async (name) => {
          const [[{ id }]] = await pool.query('SELECT id FROM job_categories WHERE name = ?', [name]);
          return [eventId, id];
        }));
        await pool.query('INSERT INTO event_categories (event_id, category_id) VALUES ?', [categoryIds]);
      }

      res.json({ id: eventId });
    } catch (error) {
      console.error('POST /calendar_eventsAPI error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // PUT update event date
  router.put('/:id/date', async (req, res) => {
    const { start, end } = req.body;
    const { id } = req.params;

    try {
      await pool.query('UPDATE calendar_events SET start = ?, end = ? WHERE id = ?', [start, end || null, id]);
      res.json({ success: true });
    } catch (err) {
      console.error('PUT /:id/date error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // PUT update duration only (end)
  router.put('/:id/duration', async (req, res) => {
    const { end } = req.body;
    const { id } = req.params;

    try {
      await pool.query('UPDATE calendar_events SET end = ? WHERE id = ?', [end, id]);
      res.json({ success: true });
    } catch (err) {
      console.error('PUT /:id/duration error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // PUT update categories
  router.put('/:id/categories', async (req, res) => {
    const { categories } = req.body;
    const { id } = req.params;

    try {
      await pool.query('DELETE FROM event_categories WHERE event_id = ?', [id]);

      if (Array.isArray(categories) && categories.length > 0) {
        const categoryIds = await Promise.all(categories.map(async (name) => {
          const [[{ id: categoryId }]] = await pool.query('SELECT id FROM job_categories WHERE name = ?', [name]);
          return [id, categoryId];
        }));
        await pool.query('INSERT INTO event_categories (event_id, category_id) VALUES ?', [categoryIds]);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('PUT /:id/categories error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // PUT assign employees
  router.put('/:id/employees', async (req, res) => {
  const { employees } = req.body;
  const { id } = req.params;

  try {
    console.log("[PUT /:id/employees] event_id:", id);
    console.log("[PUT /:id/employees] employees:", employees);

    await pool.query('DELETE FROM event_employees WHERE event_id = ?', [id]);

    const validEmployeeIds = (employees || []).filter((empId) => Number.isInteger(empId));
    const values = validEmployeeIds.map(empId => [parseInt(id), empId]);

    console.log("[PUT /:id/employees] Insert values:", values);

    if (values.length > 0) {
      await pool.query('INSERT INTO event_employees (event_id, employee_id) VALUES ?', [values]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /:id/employees error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



  // PUT assign locations
  router.put('/:id/locations', async (req, res) => {
    const { locations } = req.body;
    const { id } = req.params;

    try {
      await pool.query('DELETE FROM event_locations WHERE event_id = ?', [id]);

      if (Array.isArray(locations) && locations.length > 0) {
        const values = await Promise.all(locations.map(async (name) => {
          const [[{ id: locId }]] = await pool.query('SELECT id FROM job_locations WHERE name = ?', [name]);
          return [id, locId];
        }));
        await pool.query('INSERT INTO event_locations (event_id, location_id) VALUES ?', [values]);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('PUT /:id/locations error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // DELETE event
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      await pool.query('DELETE FROM calendar_events WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error('DELETE /:id error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};
