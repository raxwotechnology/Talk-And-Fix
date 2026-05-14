const User = require('../models/User');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendNotification } = require('../utils/notificationService');

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const filter = {};
    if (storeId) filter.assignedStore = storeId;
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { next(error); }
};

// @desc    Update user role (legacy)
// @route   PUT /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }
    user.role = req.body.role;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) { next(error); }
};

// @desc    Create new user (employee/admin)
// @route   POST /api/admin/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, assignedStore, avatar, employeeInfo, permissions, addresses } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400); return next(new Error('User already exists')); }

    const user = await User.create({
      name, email, password, phone, role, assignedStore, avatar, employeeInfo, permissions, addresses
    });

    res.status(201).json(user);
  } catch (error) { next(error); }
};

// @desc    Update user details (employee/admin)
// @route   PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.role = req.body.role || user.role;
    user.assignedStore = req.body.assignedStore || user.assignedStore;
    user.avatar = req.body.avatar || user.avatar;
    user.employeeInfo = req.body.employeeInfo || user.employeeInfo;
    user.permissions = req.body.permissions || user.permissions;
    user.agreements = req.body.agreements || user.agreements;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) { next(error); }
};

// @desc    Toggle user active status (activate/deactivate)
// @route   PUT /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }

    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      return next(new Error('You cannot deactivate your own account'));
    }

    user.isActive = !user.isActive;
    await user.save();

    // Notify user
    await sendNotification({
      userId: user._id,
      type: 'account_update',
      title: user.isActive ? 'Account Activated ✅' : 'Account Deactivated ⛔',
      message: user.isActive
        ? 'Your account has been reactivated. You can now log in again.'
        : 'Your account has been deactivated by an administrator.',
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) { next(error); }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) { next(error); }
};

// @desc    Get all stores (including inactive)
// @route   GET /api/admin/stores
const getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find({}).populate('managerId', 'name email').sort({ createdAt: -1 });
    res.json(stores);
  } catch (error) { next(error); }
};

// @desc    Toggle store active status
// @route   PUT /api/admin/stores/:id/toggle
const toggleStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) { res.status(404); return next(new Error('Store not found')); }
    store.isActive = !store.isActive;
    await store.save();
    res.json(store);
  } catch (error) { next(error); }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { startDate, endDate, storeId, status } = req.query;
    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (status) filter.orderStatus = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('storeId', 'name')
      .populate('deliveryGuyId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { next(error); }
};

// @desc    Get all products for admin
// @route   GET /api/admin/products
const getAllProducts = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const filter = {};
    if (storeId) filter.storeId = storeId;

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('storeId', 'name')
      .populate('supplierId', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) { next(error); }
};

// @desc    Approve order
// @route   PUT /api/admin/orders/:id/approve
const approveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); return next(new Error('Order not found')); }

    if (order.orderStatus !== 'pending') {
      res.status(400);
      return next(new Error(`Cannot approve order with status "${order.orderStatus}"`));
    }

    order.orderStatus = 'confirmed';
    const updated = await order.save();

    // Notify customer
    await sendNotification({
      userId: order.userId,
      type: 'order_update',
      title: 'Order Confirmed ✅',
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been approved and confirmed.`,
      link: '/orders',
    });

    res.json(updated);
  } catch (error) { next(error); }
};

// @desc    Cancel order
// @route   PUT /api/admin/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); return next(new Error('Order not found')); }

    if (['delivered', 'completed', 'cancelled'].includes(order.orderStatus)) {
      res.status(400);
      return next(new Error(`Cannot cancel order with status "${order.orderStatus}"`));
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = 'cancelled';
    order.paymentStatus = order.paymentStatus === 'completed' ? 'refunded' : 'failed';
    const updated = await order.save();

    // Notify customer
    await sendNotification({
      userId: order.userId,
      type: 'order_update',
      title: 'Order Cancelled ❌',
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled.${req.body.reason ? ' Reason: ' + req.body.reason : ''}`,
      link: '/orders',
    });

    res.json(updated);
  } catch (error) { next(error); }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const { storeId } = req.query;
    const userFilter = storeId ? { assignedStore: storeId } : {};
    const productFilter = storeId ? { storeId } : {};
    const orderFilter = storeId ? { storeId } : {};
    const storeFilter = storeId ? { _id: storeId } : {};

    const [users, stores, products, orders] = await Promise.all([
      User.countDocuments(userFilter),
      Store.countDocuments(storeFilter),
      Product.countDocuments(productFilter),
      Order.find(orderFilter),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
    const completedOrders = orders.filter((o) => ['delivered', 'completed'].includes(o.orderStatus)).length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === 'cancelled').length;
    const activeUsers = await User.countDocuments({ ...userFilter, isActive: true });
    const deactivatedUsers = await User.countDocuments({ ...userFilter, isActive: false });

    res.json({
      users,
      activeUsers,
      deactivatedUsers,
      stores,
      products,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
    });
  } catch (error) { next(error); }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAllStores,
  toggleStore,
  getAllOrders,
  getAllProducts,
  approveOrder,
  cancelOrder,
  getStats,
};
