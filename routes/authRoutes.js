import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";


const router = express.Router();

router.get("/login", (req, res) => {
    res.render("login", {
        message: null,
        user: null,
        showRegister: false,
        invalidLogin: false,
        formData: {} ,
    });
});

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get('/logout', logoutUser);

export default router;    
