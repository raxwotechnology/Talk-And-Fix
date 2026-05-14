const Transaction = require('../models/Transaction');
const Store = require('../models/Store');
const Order = require('../models/Order');

// @desc    Get full ledger dashboard
// @route   GET /api/finance/dashboard
// @access  Private
const getFinancialDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, period } = req.query;
    
    // Store scoping for managers
    let storeFilter = {};
    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) storeFilter = { storeId: store._id };
    } else if (storeId && storeId !== 'all') {
      storeFilter = { storeId };
    }

    // Date filtering
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length > 0) {
      storeFilter.date = dateFilter;
    }

    const transactions = await Transaction.find(storeFilter).sort({ date: 1 });

    // Orders for Revenue
    const orderFilter = { ...storeFilter, orderStatus: { $nin: ['cancelled'] } };
    if (Object.keys(dateFilter).length > 0) orderFilter.createdAt = dateFilter;
    const orders = await Order.find(orderFilter);

    // Aggregates
    const orderRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const posRevenue = orders.filter(o => o.isPosOrder).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const onlineRevenue = orderRevenue - posRevenue;
    const orderCount = orders.length;
    const totalItemsSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((x, it) => x + (it.quantity || 0), 0), 0);

    const manualIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = orderRevenue + manualIncome;
    const balance = totalIncome - totalExpense;

    // Charts generation
    const p = ['daily', 'monthly', 'yearly'].includes(String(period)) ? String(period) : 'monthly';
    const makeKey = (d) => {
      if (p === 'daily') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (p === 'yearly') return `${d.getFullYear()}`;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    
    const formatLabel = (key) => {
      if (p === 'daily') return key;
      if (p === 'yearly') return key;
      const [yy, mm] = key.split('-');
      const dt = new Date(Number(yy), Number(mm) - 1, 1);
      return dt.toLocaleDateString('en', { month: 'short', year: '2-digit' });
    };

    const seriesMap = new Map();
    // Add transactions
    for (const t of transactions) {
      const key = makeKey(new Date(t.date));
      const cur = seriesMap.get(key) || { key, label: formatLabel(key), income: 0, expense: 0, profit: 0, revenue: 0 };
      if (t.type === 'income') cur.income += t.amount;
      if (t.type === 'expense') cur.expense += t.amount;
      seriesMap.set(key, cur);
    }
    // Add orders
    for (const o of orders) {
      const key = makeKey(new Date(o.createdAt));
      const cur = seriesMap.get(key) || { key, label: formatLabel(key), income: 0, expense: 0, profit: 0, revenue: 0 };
      cur.revenue += o.totalAmount;
      cur.income += o.totalAmount; // Orders count as income
      seriesMap.set(key, cur);
    }
    
    // Calculate profit
    for (const [key, cur] of seriesMap.entries()) {
      cur.profit = cur.income - cur.expense;
    }

    // Categories breakdown
    const expenseByCategory = {};
    const incomeByCategory = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      } else {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      }
    });

    const series = Array.from(seriesMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    res.json({
      totalRevenue: orderRevenue,
      posRevenue,
      onlineRevenue,
      totalAdditionalIncome: manualIncome,
      totalIncome,
      totalExpense,
      totalExpenses: totalExpense,
      balance,
      netProfit: balance,
      orderCount,
      totalItemsSold,
      expenseCount: transactions.filter(t => t.type === 'expense').length,
      transactionCount: transactions.length,
      series,
      monthlyData: series, // For backward compatibility
      expenseByCategory,
      incomeByCategory,
    });
  } catch (error) { next(error); }
};

// @desc    Create transaction (income/expense)
// @route   POST /api/finance/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { storeId, type, category, amount, paymentMethod, referenceNo, description, date, attachments } = req.body;

    let assignedStore = storeId;
    if (!assignedStore && req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    }

    const transaction = await Transaction.create({
      storeId: assignedStore || null,
      type,
      category,
      amount,
      paymentMethod: paymentMethod || 'Cash',
      referenceNo,
      description,
      date: date || new Date(),
      createdBy: req.user._id,
      attachments: attachments || []
    });

    res.status(201).json(transaction);
  } catch (error) { next(error); }
};

// @desc    Get all transactions
// @route   GET /api/finance/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, type } = req.query;
    const filter = {};

    let assignedStore = storeId;
    if (req.user.role === 'manager') {
      const store = await Store.findOne({ managerId: req.user._id });
      if (store) assignedStore = store._id;
    }

    if (assignedStore && assignedStore !== 'all') {
      filter.storeId = assignedStore;
    }
    
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('createdBy', 'name')
      .populate('storeId', 'name')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) { next(error); }
};

// @desc    Update transaction
// @route   PUT /api/finance/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) { res.status(404); return next(new Error('Transaction not found')); }

    const fields = ['type', 'category', 'amount', 'paymentMethod', 'referenceNo', 'description', 'date', 'attachments'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) transaction[f] = req.body[f];
    });

    await transaction.save();
    res.json(transaction);
  } catch (error) { next(error); }
};

// @desc    Delete transaction
// @route   DELETE /api/finance/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) { res.status(404); return next(new Error('Transaction not found')); }
    
    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (error) { next(error); }
};

// @desc    Get all cheques from transactions
// @route   GET /api/finance/cheques
// @access  Private
const getCheques = async (req, res, next) => {
  try {
    const { storeId, status } = req.query;
    const filter = { paymentMethod: 'Cheque' };

    if (storeId && storeId !== 'all') filter.storeId = storeId;
    if (status) filter['chequeDetails.status'] = status;

    const transactions = await Transaction.find(filter)
      .populate('storeId', 'name')
      .populate('createdBy', 'name')
      .sort({ 'chequeDetails.dueDate': 1 });

    res.json(transactions);
  } catch (error) { next(error); }
};

// @desc    Update cheque status
// @route   PUT /api/finance/cheques/:id/status
// @access  Private
const updateChequeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) { res.status(404); return next(new Error('Transaction not found')); }

    if (transaction.paymentMethod !== 'Cheque') {
      res.status(400);
      return next(new Error('This transaction does not have a cheque'));
    }

    const oldStatus = transaction.chequeDetails.status;
    transaction.chequeDetails.status = status;
    await transaction.save();

    // Update account balance if status changed to/from 'Cleared'
    if (transaction.accountId && oldStatus !== status) {
      const Account = require('../models/Account');
      const account = await Account.findById(transaction.accountId);
      
      if (account) {
        if (status === 'Cleared') {
          // Add to balance if it's income, subtract if it's expense
          if (transaction.type === 'income') account.balance += transaction.amount;
          else if (transaction.type === 'expense') account.balance -= transaction.amount;
        } else if (oldStatus === 'Cleared') {
          // Reverse the balance update if moving away from 'Cleared'
          if (transaction.type === 'income') account.balance -= transaction.amount;
          else if (transaction.type === 'expense') account.balance += transaction.amount;
        }
        await account.save();
      }
    }

    res.json(transaction);
  } catch (error) { next(error); }
};

module.exports = {
  getFinancialDashboard,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getCheques,
  updateChequeStatus,
};

