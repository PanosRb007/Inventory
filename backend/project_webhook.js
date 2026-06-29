const express = require('express');
const sanitizeHtml = require('sanitize-html');
const he = require('he');

const projectWebhook = (pool) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const payload = normalizePayload(req.body);
    console.log('Received project webhook payload:', payload);

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    const { name, description, amount, deallink, driveurl, QuotedItems } = payload;

    if (!name) {
      return res.status(400).json({ error: 'Missing required fields: name' });
    }

    const cleanName = sanitizeAndDecode(name);
    const cleanDescription = sanitizeAndDecode(description);
    const sale = Number.isFinite(Number.parseFloat(amount))
      ? Number.parseFloat(amount)
      : 0;
    const quotedItems = normalizeQuotedItems(QuotedItems);

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      const projectSql = `
        INSERT INTO projects (name, description, sale, deallink, driveurl)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [projectResult] = await conn.query(projectSql, [
        cleanName,
        cleanDescription,
        sale,
        coerceNullableString(deallink),
        coerceNullableString(driveurl),
      ]);

      const projectId = projectResult.insertId;
      const quotedItemsData = quotedItems.map((item) => [
        projectId,
        coerceNullableString(item.product_id),
        sanitizeAndDecode(item.Product_Name),
        coerceNullableString(item.Currency),
        coerceNullableNumber(item.Quantity),
        coerceNullableNumber(item.Discount),
        coerceNullableNumber(item.total_after_discount),
        coerceNullableNumber(item.net_total),
        coerceNullableNumber(item.Tax),
        coerceNullableNumber(item.list_price),
        coerceNullableNumber(item.unit_price),
        coerceNullableNumber(item.quantity_in_stock),
        coerceNullableNumber(item.total),
        sanitizeAndDecode(item.product_description || ''),
      ]);

      if (quotedItemsData.length > 0) {
        const quotedItemSql = `
          INSERT INTO quoted_items (
            project_id, product_id, product_name, currency, quantity, discount,
            total_after_discount, net_total, tax, list_price, unit_price,
            quantity_in_stock, total, product_description
          ) VALUES ?
        `;
        await conn.query(quotedItemSql, [quotedItemsData]);
      }

      await conn.commit();
      res.status(201).json({
        success: true,
        message: 'Project and quoted items added successfully',
        projectId,
        quotedItemsInserted: quotedItemsData.length,
      });
    } catch (error) {
      console.error('Error adding project and quoted items:', error);
      if (conn) {
        await conn.rollback();
      }
      res.status(500).json({
        error: 'Failed to add project and quoted items',
        details: error.message,
      });
    } finally {
      if (conn) {
        conn.release();
      }
    }
  });

  return router;
};

function sanitizeAndDecode(input) {
  return he.decode(
    sanitizeHtml(input || '', {
      allowedTags: ['br'],
      allowedAttributes: {},
    }).replace(/<br\s*\/?>/g, '\r\n')
  );
}

function normalizePayload(body) {
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return null;
    }
  }

  return body;
}

function normalizeQuotedItems(quotedItems) {
  if (Array.isArray(quotedItems)) {
    return quotedItems;
  }

  if (typeof quotedItems === 'string' && quotedItems.trim()) {
    try {
      const parsed = JSON.parse(quotedItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

function coerceNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coerceNullableString(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value);
}

module.exports = projectWebhook;