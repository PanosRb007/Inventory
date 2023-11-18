const express = require('express');

const router = express.Router();

module.exports = (pool) => {

router.post('/', async (req, res) => {
    try {
        const { name, submaterials } = req.body;
        const connection = await pool.getConnection();

        // Step 1: Save the combined material in your database
        const [rows] = await connection.execute('INSERT INTO combined_materials (name) VALUES (?)', [name]);
        const combinedMaterialId = rows.insertId;

        // Step 2: Save each submaterial
        for (const material of submaterials) {
            await connection.execute('INSERT INTO submaterials (combined_material_id, material_id, multiplier) VALUES (?, ?, ?)', [combinedMaterialId, material.materialId, material.multiplier]);
        }

        await connection.release();
            res.status(200).json({ message: 'Combined material saved successfully!' });
        } catch (error) {
            console.error('Error saving combined material:', error);
            res.status(500).json({ message: 'Error saving combined material' });
        }
    });


return router;
};

