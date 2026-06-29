const express = require('express');

const createoutflowRouter = (pool) => {
  const router = express.Router();

  // Get all outflows
  router.get('/', async (req, res) => {
    try {
      const userRole = req.user?.userRole;
      const userId = req.user?.empid; // ή userId, ανάλογα πώς το έχεις

      let sql, params;

      if (userRole === 'graphics') {
        sql = `
          SELECT o.*
FROM outflows o
LEFT JOIN materiallist m ON o.materialid = m.matid
WHERE
    m.field IN ('VINYLS', 'VINYL ','BANNER', 'DIGITAL PRINT', 'SPECIAL', 'LAMINATION', 'ROLLUP', 'ΑΜΜΟΒΟΛΗ', 'ΣΥΝΤΗΡΗΣΗ ΕΚΤΥΠΩΤΗ')
	AND o.location = 1
ORDER BY o.outflowid DESC
        `;
        params = [userId];
      } else {
        sql = `SELECT * FROM outflows`;
        params = [];
      }

      const [results] = await pool.query(sql, params);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving outflows:', error);
      res.status(500).json({ error: 'Failed to retrieve outflows' });
    }
  });

  // Get a specific outflow by outflowid
  router.get('/:outflowid', async (req, res) => {
    const { outflowid } = req.params;
    try {
      const sql = 'SELECT * FROM outflows WHERE outflowid = ?';
      const [results] = await pool.query(sql, [outflowid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'outflow not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving outflow:', error);
      res.status(500).json({ error: 'Failed to retrieve outflow' });
    }
  });

  // Add a new outflow
  router.post('/', async (req, res) => {
  const { location, materialid, width, lotnumber, quantity, employee, project, comments,quotedItemid  } = req.body;

  // Ensure that width and quantity are rounded to 2 decimal places
  const roundedQuantity = parseFloat(quantity).toFixed(2);  // Round quantity to 2 decimals
  const roundedWidth = width ? parseFloat(width).toFixed(2) : null;  // Round width to 2 decimals, if width is provided

  try {
    const sql = 'INSERT INTO outflows (location, materialid, width, lotnumber, quantity, employee, project, comments,quotedItemid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await pool.query(sql, [location, materialid, roundedWidth, lotnumber, roundedQuantity, employee, project, comments,quotedItemid]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error adding outflow:', error);
    res.status(500).json({ error: 'Failed to add outflow' });
  }
});


  // Update an existing outflow
  router.put('/:outflowid', async (req, res) => {
	  console.log('PUT Request received:');
  console.log('Params:', req.params);
  console.log('Body:', req.body);
    const { outflowid } = req.params;
    const { location, materialid, width, lotnumber, quantity, employee, project, comments, quotedItemid } = req.body;
  
    try {
      const sql = 'UPDATE outflows SET location=?, materialid=?, width=?, lotnumber=?, quantity=?, employee=?, project=?, comments=? , quotedItemid=? WHERE outflowid=?';
      await pool.query(sql, [location, materialid, width, lotnumber, quantity, employee, project, comments, quotedItemid, outflowid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating outflow:', error);
      res.status(500).json({ error: 'Failed to update outflow' });
    }
  });




  // Delete an outflow
  router.delete('/:outflowid', async (req, res) => {
    const { outflowid } = req.params;

    try {
      const sql = `DELETE FROM outflows WHERE outflowid = ?`;
      await pool.query(sql, [outflowid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting outflow:', error);
      res.status(500).json({ error: 'Failed to delete outflow' });
    }
  });

router.get('/unique-materials/:location', async (req, res) => {
  const { location } = req.params;
  try {
    const sql = `
      SELECT 
          p.materialid,
          p.width,
          p.lotnumber,
          p.total_purchased,
          COALESCE(o.total_outflow, 0) AS total_outflow,
          (p.total_purchased - COALESCE(o.total_outflow, 0)) AS remaining_quantity
      FROM 
          (
              SELECT 
                  materialid,
                  width,
                  lotnumber,
                  SUM(quantity) AS total_purchased
              FROM 
                  purchase
              WHERE 
                  location = ?
              GROUP BY 
                  materialid, width, lotnumber
          ) p
      LEFT JOIN 
          (
              SELECT 
                  materialid,
                  width,
                  lotnumber,
                  SUM(quantity) AS total_outflow
              FROM 
                  outflows
              WHERE 
                  location = ?
              GROUP BY 
                  materialid, width, lotnumber
          ) o
      ON p.materialid = o.materialid
         AND (p.width = o.width OR (p.width IS NULL AND o.width IS NULL))
         AND p.lotnumber = o.lotnumber
      HAVING 
          remaining_quantity > 0
      ORDER BY 
          p.materialid, p.width, p.lotnumber;
    `;
    
    const [results] = await pool.query(sql, [location, location]);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving unique materials:', error);
    res.status(500).json({ error: 'Failed to retrieve unique materials' });
  }
});


 router.get('/unique-widths/:materialid/:location', async (req, res) => {
  const { materialid, location } = req.params;
  try {
    const sql = `
      SELECT 
          p.width,
          SUM(p.quantity) AS total_inflows,
          COALESCE(SUM(o.quantity), 0) AS total_outflows,
          (SUM(p.quantity) - COALESCE(SUM(o.quantity), 0)) AS remaining_quantity
      FROM 
          (
              SELECT 
                  materialid,
                  width,
                  SUM(quantity) AS quantity
              FROM 
                  purchase
              WHERE 
                  materialid = ? AND location = ?
              GROUP BY 
                  materialid, width
          ) p
      LEFT JOIN 
          (
              SELECT 
                  materialid,
                  width,
                  SUM(quantity) AS quantity
              FROM 
                  outflows
              WHERE 
                  materialid = ? AND location = ?
              GROUP BY 
                  materialid, width
          ) o
      ON 
          p.materialid = o.materialid
          AND (p.width = o.width OR (p.width IS NULL AND o.width IS NULL))
      HAVING 
          remaining_quantity > 0
      ORDER BY 
          p.width;
    `;
    const [results] = await pool.query(sql, [materialid, location, materialid, location]);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving unique widths:', error);
    res.status(500).json({ error: 'Failed to retrieve unique widths' });
  }
});


	router.get('/unique-lots/:materialid/:width/:location', async (req, res) => {
  const { materialid, width, location } = req.params;
  try {
    const sql = `
      SELECT 
          p.lotnumber,
          SUM(p.quantity) AS total_inflows,
          COALESCE(SUM(o.quantity), 0) AS total_outflows,
          (SUM(p.quantity) - COALESCE(SUM(o.quantity), 0)) AS remaining_quantity
      FROM 
          (
              SELECT 
                  materialid,
                  width,
                  lotnumber,
                  SUM(quantity) AS quantity
              FROM 
                  purchase
              WHERE 
                  materialid = ? AND width = ? AND location = ?
              GROUP BY 
                  materialid, width, lotnumber
          ) p
      LEFT JOIN 
          (
              SELECT 
                  materialid,
                  width,
                  lotnumber,
                  SUM(quantity) AS quantity
              FROM 
                  outflows
              WHERE 
                  materialid = ? AND width = ? AND location = ?
              GROUP BY 
                  materialid, width, lotnumber
          ) o
      ON 
          p.materialid = o.materialid
          AND (p.width = o.width OR (p.width IS NULL AND o.width IS NULL))
          AND p.lotnumber = o.lotnumber
      HAVING 
          remaining_quantity > 0
      ORDER BY 
          p.lotnumber;
    `;
    const [results] = await pool.query(sql, [materialid, width, location, materialid, width, location]);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving unique lots:', error);
    res.status(500).json({ error: 'Failed to retrieve unique lots' });
  }
});
	
router.get('/remaining-quantity/:materialid/:width/:lotnumber/:location', async (req, res) => {
  const { materialid, width, lotnumber, location } = req.params;
  try {
    const sql = `
      SELECT 
          p.materialid,
          p.width,
          p.lotnumber,
          p.location,
          COALESCE(SUM(p.quantity), 0) AS total_inflows,
          COALESCE(SUM(o.quantity), 0) AS total_outflows,
          (COALESCE(SUM(p.quantity), 0) - COALESCE(SUM(o.quantity), 0)) AS remaining_quantity
      FROM 
          (
              SELECT 
                  materialid,
                  width,
                  lotnumber,
                  location,
                  SUM(quantity) AS quantity
              FROM 
                  purchase
              WHERE 
                  materialid = ? 
                  AND width = ? 
                  AND lotnumber = ?
                  AND location = ?
              GROUP BY 
                  materialid, width, lotnumber, location
          ) p
      LEFT JOIN 
          (
              SELECT 
                  materialid,
                  width,
                  lotnumber,
                  location,
                  SUM(quantity) AS quantity
              FROM 
                  outflows
              WHERE 
                  materialid = ? 
                  AND width = ? 
                  AND lotnumber = ?
                  AND location = ?
              GROUP BY 
                  materialid, width, lotnumber, location
          ) o
      ON 
          p.materialid = o.materialid
          AND (p.width = o.width OR (p.width IS NULL AND o.width IS NULL))
          AND p.lotnumber = o.lotnumber
          AND p.location = o.location
      GROUP BY 
          p.materialid, p.width, p.lotnumber, p.location;
    `;

    const [results] = await pool.query(sql, [
      materialid, width, lotnumber, location, 
      materialid, width, lotnumber, location
    ]);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving remaining quantity:', error);
    res.status(500).json({ error: 'Failed to retrieve remaining quantity' });
  }
});

// PATCH μόνο για το highlighted
router.patch('/:outflowid/highlighted', async (req, res) => {
  try {
    const { highlighted } = req.body;
    const { outflowid } = req.params;
    const sql = `UPDATE outflows SET highlighted=? WHERE outflowid=?`;
    await pool.query(sql, [highlighted ? 1 : 0, outflowid]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating highlighted:', error);
    res.status(500).json({ error: 'Failed to update highlighted' });
  }
});

  return router;
};

module.exports = createoutflowRouter;
