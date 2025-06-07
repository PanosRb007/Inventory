/**
 * Μορφοποιεί μια τιμή σε ευρώ.
 * @param {number} value - Η τιμή προς μορφοποίηση.
 * @returns {string} - Η μορφοποιημένη τιμή.
 */
export function formatCurrency(value) {
  return `${parseFloat(value).toFixed(2)} €`;
}