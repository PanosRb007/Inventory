const express = require('express');

const createprojectRouter = (pool) => {
  const router = express.Router();

  // Get all projects
 router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.prid, p.name, p.m2, p.description, p.sale, p.deallink, p.driveurl, p.status,p.prmatcost, p.prlabcost, p.realmatcost, p.reallabcost, p.totalcost,
        qi.id, qi.product_id, qi.product_name, qi.quantity, qi.unit_price, qi.total, qi.product_description
      FROM projects p
      LEFT JOIN quoted_items qi ON p.prid = qi.project_id;
    `;

    const [results] = await pool.query(sql);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No projects found' });
    }

    // Ομαδοποίηση των αποτελεσμάτων
    const projects = results.reduce((acc, row) => {
      let project = acc.find(p => p.prid === row.prid);
      if (!project) {
        project = {
          prid: row.prid,
          name: row.name,
			m2:row.m2,
          description: row.description,
          sale: row.sale,
		  prmatcost: row.prmatcost,
		  prlabcost: row.prlabcost,
		  realmatcost: row.realmatcost,
		  reallabcost: row.reallabcost,
		  totalcost: row.totalcost,
          deallink: row.deallink,
          driveurl: row.driveurl,
		  status: row.status,
          quotedItems: []
        };
        acc.push(project);
      }
      if (row.product_id) {
        project.quotedItems.push({
			id: row.id,
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          unit_price: row.unit_price,
          total: row.total,
          product_description: row.product_description
        });
      }
      return acc;
    }, []);

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error retrieving projects with quoted items:', error);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});


  // Get a specific project by prid
  router.get('/:prid', async (req, res) => {
  const { prid } = req.params;

  try {
    const sql = `
      SELECT 
        p.prid, p.name, p.m2, p.description, p.sale, p.deallink, p.driveurl, p.status,
        qi.id, qi.product_id, qi.product_name, qi.quantity, qi.unit_price, qi.total, qi.product_description
      FROM projects p
      LEFT JOIN quoted_items qi ON p.prid = qi.project_id
      WHERE p.prid = ?;
    `;

    const [results] = await pool.query(sql, [prid]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Δημιουργία του μοναδικού project object
    const project = {
      prid: results[0].prid,
      name: results[0].name,
	  m2: results[0].m2,
      description: results[0].description,
      sale: results[0].sale,
      deallink: results[0].deallink,
      driveurl: results[0].driveurl,
	  status: results[0].status,
      quotedItems: results.filter(item => item.product_id).map(item => ({
		  id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        product_description: item.product_description
      }))
    };

    res.status(200).json(project);
  } catch (error) {
    console.error('Error retrieving project with quoted items:', error);
    res.status(500).json({ error: 'Failed to retrieve project' });
  }
});



  // Add a new project
  router.post('/', async (req, res) => {
    const { name, description, m2, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate  } = req.body;
    try {
      const sql = 'INSERT INTO projects (name, description, m2, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [name, description, m2, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate ]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding project:', error);
      res.status(500).json({ error: 'Failed to add project' });
    }
  });

  // Update an existing project
  router.put('/:prid', async (req, res) => {
    const { prid } = req.params;
    const { name, description, m2 , prmatcost, prlabcost, sale, totalcost, enddate, status } = req.body;
    console.log('Updating project:', req.body);  // Log the incoming request body
    try {
      const sql = 'UPDATE projects SET name = ?, description = ?, m2 = ? , prmatcost = ?, prlabcost = ?, sale = ?, totalcost = ?, enddate = ?, status = ? WHERE prid = ?';
      await pool.query(sql, [name, description,  parseFloat(m2) || 0, prmatcost, prlabcost, sale, totalcost, enddate, status, prid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });
	
  // Delete a project
  router.delete('/:prid', async (req, res) => {
    const { prid } = req.params;
    try {
      const sql = 'DELETE FROM projects WHERE prid = ?';
      await pool.query(sql, [prid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  return router;
};

module.exports = createprojectRouter;

