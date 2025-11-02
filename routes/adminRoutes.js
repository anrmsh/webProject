import express from 'express';
import {
    getAdminDashboard,
    getAdminUsers,
    getAdminHalls,
    getAdminCalendar,
    getAdminStats,
    createManager,
    deleteUser,
    updateUserStatus,
    getHallById,
    updateHallStatus,
    getBookingsByDate,
    getMonthlyBookings,
    getDashboardData,
    getNotifications,
} from '../controllers/adminController.js';
import { authMiddleware } from "../middleware/middleware.js";

const router = express.Router();

// Дашборд
router.get('/admin', getAdminDashboard);

// Пользователи
router.get('/admin/users', authMiddleware, getAdminUsers);

// Залы
router.get('/admin/halls', getAdminHalls);

// Календарь 
router.get('/admin/calendar', getAdminCalendar);

// Статистика
router.get('/admin/stats', getAdminStats);
router.post('/admin/users/registerManager', createManager);

router.delete("/admin/users/:id", deleteUser);
router.patch("/admin/users/:id/status", updateUserStatus);


router.get('/admin/halls/:id', getHallById);
router.put('/admin/halls/:hallId/status', updateHallStatus);

router.get('/admin/calendar/:date', getBookingsByDate);
router.get('/admin/calendar/:year/:month', getMonthlyBookings);

router.get('/admin/dashboard-data', getDashboardData);

router.get('/admin/notifications', getNotifications);
router.put('/admin/notifications/:hallId/status', updateHallStatus);



export default router;
