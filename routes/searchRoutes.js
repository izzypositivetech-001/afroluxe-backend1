import express from 'express';
import {
  advancedSearch,
  getSearchSuggestions,
  getFilterOptions,
  searchByCategory,
  getPopularSearches,
  searchByPriceRange
} from '../controllers/searchController.js';

const router = express.Router();

// Advanced search (main search endpoint)
router.get('/', advancedSearch);

// Search suggestions (autocomplete)
router.get('/suggestions', getSearchSuggestions);

// Get filter options (facets)
router.get('/facets', getFilterOptions);

// Popular searches
router.get('/popular', getPopularSearches);

// Search by category
router.get('/category/:categoryId', searchByCategory);

// Search by price range
router.get('/price-range', searchByPriceRange);

export default router;