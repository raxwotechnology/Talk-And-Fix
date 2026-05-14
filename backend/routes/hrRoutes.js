const express = require('express');
const router = express.Router();
const {
  checkIn, checkOut, getMyAttendance, getAttendanceReport,
  requestLeave, getMyLeaves, getStoreLeaves, approveLeave, rejectLeave,
  getEmployees, addEmployee, updateEmployee,
  startBreak, endBreak, getBreakHistory, getActiveBreak,
  createTarget, getTargets, getMyTargets, updateTargetProgress, payTargetBonus,
  getEmployeePerformance,
  adminMarkAttendance, adminCreateLeave, deleteTarget
} = require('../controllers/hrController');
const { protect, authorize, requirePermission } = require('../middleware/authMiddleware');

router.use(protect);

// Attendance
router.post('/attendance/check-in', authorize('cashier', 'deliveryGuy', 'stockEmployee', 'manager'), checkIn);
router.post('/attendance/check-out', authorize('cashier', 'deliveryGuy', 'stockEmployee', 'manager'), checkOut);
router.get('/attendance', getMyAttendance);
router.get('/attendance/report', requirePermission('employees'), getAttendanceReport);
router.post('/attendance/mark', requirePermission('employees'), adminMarkAttendance);

// Leaves
router.post('/leaves', requestLeave);
router.get('/leaves', getMyLeaves);
router.get('/leaves/store', requirePermission('employees'), getStoreLeaves);
router.put('/leaves/:id/approve', requirePermission('employees'), approveLeave);
router.put('/leaves/:id/reject', requirePermission('employees'), rejectLeave);
router.post('/leaves/create-for-employee', requirePermission('employees'), adminCreateLeave);

// Employees
router.get('/employees', requirePermission('employees'), getEmployees);
router.post('/employees', requirePermission('employees'), addEmployee);
router.put('/employees/:id', requirePermission('employees'), updateEmployee);

// Breaks
router.post('/breaks/start', authorize('cashier', 'deliveryGuy', 'stockEmployee', 'manager'), startBreak);
router.post('/breaks/end', authorize('cashier', 'deliveryGuy', 'stockEmployee', 'manager'), endBreak);
router.get('/breaks/active', getActiveBreak);
router.get('/breaks', getBreakHistory);

// Targets
router.post('/targets', requirePermission('employees'), createTarget);
router.get('/targets/me', getMyTargets);
router.get('/targets', requirePermission('employees'), getTargets);
router.put('/targets/:id/progress', requirePermission('employees'), updateTargetProgress);
router.put('/targets/:id/pay-bonus', requirePermission('employees'), payTargetBonus);
router.delete('/targets/:id', requirePermission('employees'), deleteTarget);

// Performance
router.get('/performance/:employeeId', requirePermission('employees'), getEmployeePerformance);

module.exports = router;
