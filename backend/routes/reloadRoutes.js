const express = require('express');
const router = express.Router();
const {
  createReload,
  getReloads,
} = require('../controllers/reloadController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getReloads)
  .post(createReload);

module.exports = router;
