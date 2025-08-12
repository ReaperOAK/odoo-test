/**
 * Search utility functions for filtering listings
 */

/**
 * Normalize text for searching - removes extra spaces, converts to lowercase
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Check if any of the searchable fields contains the search term
 * @param {Object} listing - The listing object to search in
 * @param {string} searchTerm - The term to search for
 * @returns {boolean} - Whether the listing matches the search term
 */
export const searchListing = (listing, searchTerm) => {
  if (!searchTerm || !listing) return true;
  
  const normalizedSearchTerm = normalizeText(searchTerm);
  if (!normalizedSearchTerm) return true;

  // Define searchable fields
  const searchableFields = [
    listing.title,
    listing.description,
    listing.category,
    listing.subcategory,
    listing.location?.address,
    listing.location?.city,
    listing.location?.state,
    listing.location?.country,
    listing.location?.zipCode,
    listing.tags?.join(' '), // If tags exist
    listing.brand, // If brand exists
    listing.model, // If model exists
  ];

  // Create searchable text from all fields
  const searchableText = searchableFields
    .filter(field => field) // Remove null/undefined fields
    .map(field => normalizeText(field))
    .join(' ');
  
  // For partial matching, check if searchable text includes the search term
  return searchableText.includes(normalizedSearchTerm);
};

/**
 * Filter listings based on search term with fuzzy matching
 * @param {Array} listings - Array of listings to filter
 * @param {string} searchTerm - The search term
 * @returns {Array} - Filtered listings
 */
export const filterListings = (listings, searchTerm) => {
  if (!searchTerm || !Array.isArray(listings)) {
    return listings;
  }
  
  return listings.filter(listing => searchListing(listing, searchTerm));
};

/**
 * Highlight matching text in search results
 * @param {string} text - Text to highlight
 * @param {string} searchTerm - Term to highlight
 * @returns {string} - Text with highlighting
 */
export const highlightMatch = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const normalizedSearchTerm = normalizeText(searchTerm);
  const searchTerms = normalizedSearchTerm.split(' ').filter(term => term.length > 0);
  
  let highlightedText = text;
  
  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
};
