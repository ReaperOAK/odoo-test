const express = require('express');
const listingController = require('../controllers/listing.controller');
const { validateListingCreation, validateListingUpdate, validateAvailabilityCheck } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { requireHost } = require('../middleware/roles');

const router = express.Router();

// Public routes
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListing);
router.get('/:id/availability', validateAvailabilityCheck, listingController.checkAvailability);

// Protected routes
router.use(authenticate);

// Host-only routes
router.post('/', requireHost, validateListingCreation, listingController.createListing);
router.patch('/:id', requireHost, validateListingUpdate, listingController.updateListing);
router.delete('/:id', requireHost, listingController.deleteListing);

module.exports = router;
