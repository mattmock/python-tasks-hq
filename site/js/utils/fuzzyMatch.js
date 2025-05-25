/**
 * Performs a simple fuzzy match between text and query
 * @param {string} text - The text to search in
 * @param {string} query - The search query
 * @returns {boolean} - Whether the text matches the query
 */
export function fuzzyMatch(text, query) {
    if (!query) return true;
    if (!text) return false;
    
    let t = 0, q = 0;
    text = text.toLowerCase();
    query = query.toLowerCase();
    
    while (t < text.length && q < query.length) {
        if (text[t] === query[q]) q++;
        t++;
    }
    return q === query.length;
} 