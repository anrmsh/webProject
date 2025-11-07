import express from 'express';
import {
    getAdminHonePage,
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
    getReportsList,
    getReportView

} from '../controllers/adminController.js';
import { authMiddleware } from "../middleware/middleware.js";

const router = express.Router();

router.get('/admin', getAdminHonePage);

router.get('/admin/users', authMiddleware, getAdminUsers);

router.get('/admin/halls', getAdminHalls);

router.get('/admin/calendar', getAdminCalendar);

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


router.get("/admin/reports", (req, res) => {
  res.render("p_admin/reports"); 
});
router.get("/admin/reports/list", getReportsList);
router.get("/admin/reports/view/:id", getReportView);



export default router;
