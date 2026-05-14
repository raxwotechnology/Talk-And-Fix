const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAccounts,
  createAccount,
  updateAccount,
  getAccountTransactions
} = require('../controllers/accountController');

router.use(protect);

router.route('/')
  .get(getAccounts)
  .post(authorize('admin'), createAccount);

router.route('/:id')
  .put(authorize('admin'), updateAccount);

router.get('/:id/transactions', getAccountTransactions);

module.exports = router;
