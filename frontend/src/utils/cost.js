/**
 * Υπολογίζει το συνολικό κόστος.
 * @param {Array} items - Η λίστα των αντικειμένων.
 * @param {Function} costCalculator - Συνάρτηση για τον υπολογισμό κόστους κάθε αντικειμένου.
 * @returns {number} - Το συνολικό κόστος.
 */
export function calculateTotalCost(items, costCalculator) {
  return items.reduce((total, item) => total + costCalculator(item), 0);
}