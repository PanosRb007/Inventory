/**
 * Υπολογίζει το κόστος με βάση τη μέθοδο FIFO.
 * @param {Array} purchases - Οι αγορές.
 * @param {Array} outflows - Οι εκροές.
 * @param {string} materialId - Το ID του υλικού.
 * @param {string} location - Η τοποθεσία.
 * @returns {number} - Το συνολικό κόστος.
 */
export function calculateFifoCost(purchases, outflows, materialId, location) {
  let remainingOutflow = outflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);
  let totalCost = 0;

  for (const purchase of purchases) {
    if (remainingOutflow <= 0) break;

    const availableQuantity = parseFloat(purchase.quantity);
    const usedQuantity = Math.min(availableQuantity, remainingOutflow);
    totalCost += usedQuantity * parseFloat(purchase.price);
    remainingOutflow -= usedQuantity;
  }

  return totalCost;
}