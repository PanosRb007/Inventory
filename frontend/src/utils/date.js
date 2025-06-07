/**
 * Μορφοποιεί μια ημερομηνία σε μορφή `DD/MM/YYYY`.
 * @param {string|Date} date - Η ημερομηνία προς μορφοποίηση.
 * @returns {string} - Η μορφοποιημένη ημερομηνία.
 */
export function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}