/**
 * Βρίσκει ένα αντικείμενο σε μια λίστα με βάση ένα κριτήριο.
 * @param {Array} items - Η λίστα των αντικειμένων.
 * @param {Function} predicate - Η συνάρτηση που καθορίζει το κριτήριο.
 * @returns {Object|null} - Το αντικείμενο ή null αν δεν βρεθεί.
 */
export function findById(items, predicate) {
  return items.find(predicate) || null;
}