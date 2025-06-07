/**
 * Δημιουργεί μοναδικές επιλογές για dropdown.
 * @param {Array} items - Η λίστα των αντικειμένων.
 * @param {string} key - Το κλειδί που θα χρησιμοποιηθεί για μοναδικότητα.
 * @returns {Array} - Η λίστα με μοναδικές επιλογές.
 */
export function getUniqueDropdownOptions(items, key) {
  return items
    .map((item) => ({
      value: item[key],
      label: item[key],
    }))
    .filter(
      (option, index, self) =>
        self.findIndex((o) => o.value === option.value) === index
    ); // Φιλτράρει μοναδικές τιμές
}