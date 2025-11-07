import express from 'express';
import {
   getManagerHomePage,
   getHallStats,
   getRatingsPage,
   getRatingsData,
   getManagerBookings,
   getManagerShedulePage,
   getRegisterHallPage,
   postRegisterHall,
   getReportPage,
   getReportData,
   saveReport,
   exportReportExcel,
   getWaitingListPage,
   getScheduleData,
   assignFromWaiting,
   getWaitingListForHall,
   getAvailableWaitingForBooking



} from '../controllers/managerController.js';


const router = express.Router();

router.get('/',getManagerHomePage);
router.get('/hall-stats/:hallId', getHallStats);
router.get("/ratings", getRatingsPage);
router.get("/ratings/data", getRatingsData);
router.get('/schedule', getManagerShedulePage);
router.get('/bookings', getManagerBookings);

router.get('/register-hall', getRegisterHallPage);
router.post('/register-hall', postRegisterHall);

router.get("/report", getReportPage);
router.get("/report/data", getReportData);
router.post("/report/save", saveReport);

router.get('/report/export', exportReportExcel);


// router.get("/waiting-list", getWaitingListPage);
// router.get("/api/waiting-list", getScheduleData);
// router.post("/api/assign-waiting/:id",  assignFromWaiting);

router.get("/waiting-list", getWaitingListPage);              // страница
router.get("/api/schedule", getScheduleData);                 // расписание на дату
router.get("/api/waiting-list", getWaitingListForHall);       // полный лист ожидания по залу
router.post("/api/assign-waiting/:id", assignFromWaiting);  
router.get("/api/waiting-list/available", getAvailableWaitingForBooking);



export default router;