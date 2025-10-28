import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/middleware.js";

const router = express.Router();

router.get("/login", (req, res) => {
    res.render("login", { message: null, user: null });
});

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get('/profile', authMiddleware, (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    res.render('profile', { user: req.user });
});


router.get('/admin', authMiddleware, (req, res) => {
    res.render('p_admin/admin');
});

router.get('/manager', authMiddleware, (req, res) => {
    res.render('p_manager/manager');
})



router.get('/logout', logoutUser);

export default router;    
