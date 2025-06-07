/**
 * Υπολογίζει το υπόλοιπο ποσότητας.
 * @param {Array} purchases - Οι αγορές.
 * @param {Array} outflows - Οι εκροές.
 * @param {string} materialId - Το ID του υλικού.
 * @param {string} location - Η τοποθεσία.
 * @returns {number} - Το υπόλοιπο ποσότητας.
 */
export function calculateRemainingQuantity(purchases, outflows, materialId, location) {
  const totalPurchases = purchases
    .filter((purchase) => purchase.materialid === materialId && purchase.location === location)
    .reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);

  const totalOutflows = outflows
    .filter((outflow) => outflow.materialid === materialId && outflow.location === location)
    .reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);

  return totalPurchases - totalOutflows;
}