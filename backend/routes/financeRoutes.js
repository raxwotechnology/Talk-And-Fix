const express = require('express');
const router = express.Router();
const {
  getFinancialDashboard,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getCheques,
  updateChequeStatus,
} = require('../controllers/financeController');

const { protect, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);
router.use(requirePermission('finance'));

// Financial Dashboard (Aggregated stats & charts)
router.get('/dashboard', getFinancialDashboard);

// Transaction Ledger (Incomes & Expenses)
router.route('/transactions')
  .get(getTransactions)
  .post(createTransaction);

router.route('/transactions/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

// Cheque Management
router.get('/cheques', getCheques);
router.put('/cheques/:id/status', updateChequeStatus);


module.exports = router;
