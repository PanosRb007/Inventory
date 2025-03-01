const express = require('express');
const sanitizeHtml = require('sanitize-html');
const he = require('he');

const projectWebhook = (pool) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    console.log('Received payload:', req.body);

    const { name, description, amount, deallink, driveurl, QuotedItems } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing required fields: name' });
    }

    // Καθαρισμός του description
    let cleanDescription = sanitizeAndDecode(description);
    const sale = parseFloat(amount);

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction(); // Ξεκινάμε transaction

      // Εισαγωγή του project στον πίνακα `projects`
      const projectSql = `
        INSERT INTO projects (name, description, sale, deallink, driveurl)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [projectResult] = await conn.query(projectSql, [
        name,
        cleanDescription,
        sale,
        deallink,
        driveurl,
      ]);

      const projectId = projectResult.insertId; // Παίρνουμε το `prid`

      // Προετοιμασία των δεδομένων για το batch insert στα QuotedItems
      const quotedItemsData = QuotedItems.map((item) => [
        projectId,
        item.product_id,
        sanitizeAndDecode(item.Product_Name),
        item.Currency,
        item.Quantity,
        item.Discount,
        item.total_after_discount,
        item.net_total,
        item.Tax,
        item.list_price,
        item.unit_price,
        item.quantity_in_stock,
        item.total,
        sanitizeAndDecode(item.product_description || ''),
      ]);

      const quotedItemSql = `
        INSERT INTO quoted_items (
          project_id, product_id, product_name, currency, quantity, discount,
          total_after_discount, net_total, tax, list_price, unit_price,
          quantity_in_stock, total, product_description
        ) VALUES ?
      `;
      await conn.query(quotedItemSql, [quotedItemsData]);

      // Ολοκλήρωση του transaction
      await conn.commit();
      res.status(201).json({
        success: true,
        message: 'Project and quoted items added successfully',
        projectId: projectId,
      });
    } catch (error) {
      console.error('Error adding project and quoted items:', error);
      if (conn) await conn.rollback(); // Επαναφορά αν υπάρχει σφάλμα
      res.status(500).json({ error: 'Failed to add project and quoted items' });
    } finally {
      if (conn) conn.release(); // Απελευθέρωση σύνδεσης
    }
  });

  return router;
};

// Helper function για καθαρισμό και αποκωδικοποίηση
function sanitizeAndDecode(input) {
  return he.decode(
    sanitizeHtml(input || '', {
      allowedTags: ['br'],
      allowedAttributes: {},
    }).replace(/<br\s*\/?>/g, '\r\n')
  );
}

module.exports = projectWebhook;
