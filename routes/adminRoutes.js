import express from 'express';
import {
    getAdminDashboard,
    getAdminUsers,
    getAdminHalls,
    getAdminCalendar,
    getAdminStats
} from '../controllers/adminController.js';

const router = express.Router();

// Дашборд
router.get('/admin', getAdminDashboard);

// Пользователи
router.get('/admin/users', getAdminUsers);

// Залы
router.get('/admin/halls', getAdminHalls);

// Календарь
router.get('/admin/calendar', getAdminCalendar);

// Статистика
router.get('/admin/stats', getAdminStats);

export default router;
