const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');

router.post('/', organizationController.createOrganization);
router.get('/:email', organizationController.getOrganization);

module.exports = router;
