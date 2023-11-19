const express = require('express');
const router = express.Router();

// Function to execute a query
async function executeQuery(connection, query, params = []) {
    const [results] = await connection.execute(query, params);
    return results;
}

// Function to fetch submaterials for a combined material
async function fetchSubmaterials(connection, combinedMaterialId) {
    const submaterialsQuery = `
        SELECT sm.*, mc.price
        FROM submaterials sm
        JOIN (
            SELECT material_id, MAX(change_id) as latest_change_id
            FROM material_changes
            GROUP BY material_id
        ) latest_changes ON sm.material_id = latest_changes.material_id
        JOIN material_changes mc ON mc.change_id = latest_changes.latest_change_id
        WHERE sm.combined_material_id = ?
    `;
    return executeQuery(connection, submaterialsQuery, [combinedMaterialId]);
}


// Function to calculate total cost
function calculateTotalCost(submaterials) {
    return submaterials.reduce((total, submaterial) => {
        return total + submaterial.multiplier * parseFloat(submaterial.price || 0);
    }, 0);
}

module.exports = (pool) => {
    router.get('/', async (req, res) => {
        try {
            const connection = await pool.getConnection();
            const combinedMaterials = await executeQuery(connection, 'SELECT * FROM combined_materials');

            for (const material of combinedMaterials) {
                const submaterials = await fetchSubmaterials(connection, material.id);
                material.totalCost = calculateTotalCost(submaterials);
                material.submaterials = submaterials;
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
