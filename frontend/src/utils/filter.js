
/**
 * Φιλτράρει μια λίστα αντικειμένων βάσει ενός κριτηρίου.
 * @param {Array} items - Η λίστα των αντικειμένων προς φιλτράρισμα.
 * @param {Function} predicate - Η συνάρτηση που καθορίζει το κριτήριο φιλτραρίσματος.
 * @returns {Array} - Η φιλτραρισμένη λίστα.
 */
export function filterItems(items, predicate) {
    if (!Array.isArray(items)) {
        throw new Error("Το πρώτο όρισμα πρέπει να είναι πίνακας.");
    }
    if (typeof predicate !== "function") {
        throw new Error("Το δεύτερο όρισμα πρέπει να είναι συνάρτηση.");
    }
    return items.filter(predicate);
}