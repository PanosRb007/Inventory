const express = require('express');

const router = express.Router();

module.exports = (pool) => {

    router.get('/', async (req, res) => {
        try {
            const connection = await pool.getConnection();

            // Fetch combined materials
            const [combinedMaterials] = await connection.execute('SELECT * FROM combined_materials');
            
            for (const material of combinedMaterials) {
                // Fetch submaterials and their latest prices
                const [submaterials] = await connection.execute(`
                    SELECT sm.*, mc.price
                    FROM submaterials sm
                    JOIN (
                        SELECT material_id, MAX(change_id) as latest_change_id
                        FROM materialchangesAPI
                        GROUP BY material_id
                    ) latest_changes ON sm.material_id = latest_changes.material_id
                    JOIN materialchangesAPI mc ON mc.change_id = latest_changes.latest_change_id
                    WHERE sm.combined_material_id = ?
                `, [material.id]);
                
                // Calculate total cost for each combined material
                let totalCost = 0;
                for (const submaterial of submaterials) {
                    totalCost += submaterial.multiplier * parseFloat(submaterial.price || 0);
                }
    
                material.totalCost = totalCost;
            }
    
            connection.release();
            res.status(200).json(combinedMaterials);
        } catch (error) {
            console.error('Error fetching combined materials:', error);
            res.status(500).json({ message: 'Error fetching combined materials' });
        }
    });

    return router;
};
