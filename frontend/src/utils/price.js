/**
 * Επιστρέφει την τελευταία τιμή ενός υλικού.
 * @param {Array} changes - Οι αλλαγές τιμών.
 * @param {string} materialId - Το ID του υλικού.
 * @returns {number} - Η τελευταία τιμή.
 */
export function findLatestPrice(changes, materialId) {
  const matchingChanges = changes.filter((change) => change.material_id === materialId);
  if (matchingChanges.length === 0) return 0;

  const latestChange = matchingChanges.reduce((latest, current) =>
    new Date(latest.change_date) > new Date(current.change_date) ? latest : current
  );

  return parseFloat(latestChange.price) || 0;
}