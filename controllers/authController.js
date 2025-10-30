import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Client } from "../models/Client.js";
import { BanquetHall } from "../models/BanquetHall.js";
import { Booking } from "../models/Booking.js";

export const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, login, password, phone, client_type } = req.body;

        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.render("login", { message: "Такой логин уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            role_id: 3,
            first_name,
            last_name,
            login,
            password: hashedPassword,
        });

        await Client.create({
            user_id: newUser.user_id,
            client_type,
            phone,
        });

        const token = jwt.sign(
            { user_id: newUser.user_id, role_id: newUser.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, { httpOnly: true });
        res.redirect("/index");
    } catch (error) {
        console.error("Registration error:", error);
        res.render("login", { message: " Ошибка при регистрации" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { login, password } = req.body;

        const user = await User.findOne({ where: { login } });
        if (!user) {
            return res.render("login", { message: "Неверный логин" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.render("login", { message: "Не удалось войти (проверьте логин и пароль)" });
        }

        if (user.status === "blocked") {
            return res.render("login", { message: "Аккаунт заблокирован" });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, { httpOnly: true });
        switch (user.role_id) {
            case 1:
                return res.redirect('admin');
            case 2:
                return res.redirect('manager');
            case 3:
                return res.redirect('index')

        }
        res.redirect("index");
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", { message: "Ошибка входа" });
    }
};

export const logoutUser = (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
};

export const getProfile = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findByPk(req.user.user_id, {
            include: [
                {
                    model: Client, as: 'client',
                    include: [
                        {
                            model: Booking, as: 'bookings',
                            include: {
                                model: BanquetHall,
                                as: 'banquetHall'
                            }
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            })
        }

        const client = user.client || null;
        const bookings = client?.bookings || [];
        const notifications = [];

        res.render('profile', {
            user,
            client,
            bookings,
            notifications
        });
    } catch (err) {
        console.error('Ошибка при загрузке страницы профиля:', err);
        res.status(500).json({
            status: false,
            message: 'Ошибка сервера при загрузке страницы профиля' + err
        })
    }
}
