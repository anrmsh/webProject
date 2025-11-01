import { User, Role, BanquetHall, Booking, Rating } from '../models/index.js';
import bcrypt from "bcrypt";
import { Op } from 'sequelize';
import WordExporter from '../public/script/p_admin/WordExporter.js'

// ===== Главная страница админа (дашборд) =====
export const getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const activeManagers = await User.count({ where: { role_id: 2, status: 'active' } });
        const totalBookings = await Booking.count();
        const allBookings = await Booking.findAll({ include: [BanquetHall] });
        const totalRevenue = allBookings.reduce((sum, b) => sum + parseFloat(b.payment_amount || 0), 0).toFixed(2);

        // Топ-зал по сумме
        const hallSums = {};
        allBookings.forEach(b => {
            const name = b.banquetHall ? b.banquetHall.hall_name : 'Без названия';
            hallSums[name] = (hallSums[name] || 0) + parseFloat(b.payment_amount || 0);
        });
        const topHall = Object.keys(hallSums).reduce((a, b) => hallSums[a] >= hallSums[b] ? a : b, '');

        // График за последние 7 дней
        const chartLabels = [];
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            chartLabels.push(dateStr);

            const count = allBookings.filter(b => b.date === dateStr).length;
            chartData.push(count);
        }



        res.render('p_admin/admin', {
            adminName: req.user ? req.user.first_name : 'Администратор',
            totalUsers,
            activeManagers,
            totalBookings,
            totalRevenue,
            topHall,
            chartLabels,
            chartData,
            notifications: 0,
            hallSums
        });
    } catch (err) {
        console.error(err);
        res.send('Ошибка загрузки дашборда');
    }
};


// ===== Пользователи =====
export const getAdminUsers = async (req, res) => {

    try {
        const currentUserId = req.user?.user_id;
        const users = await User.findAll({
            where: {
                user_id: { [Op.ne]: currentUserId },
            },
            include: {
                model: Role,
                attributes: ["role_name"],
            },
            order: [["user_id", "ASC"]],
        });

        // Формируем данные для шаблона
        const usersData = users.map(u => ({
            user_id: u.user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            login: u.login,
            role: translateRole(u.role?.role_name),
            status: translateStatus(u.status),
            rawStatus: u.status,
        }));

        res.render("p_admin/users", { users: usersData });
    } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
        res.status(500).send("Ошибка при загрузке пользователей");
    }
};

// ===== Залы =====
export const getAdminHalls = async (req, res) => {
    try {
        const halls = await BanquetHall.findAll({
            include: [Booking, Rating]
        });

        const hallsData = halls.map(h => {
            const bookings = h.bookings || [];
            const ratings = h.ratings || [];
            const totalAmount = bookings.reduce((sum, b) => sum + parseFloat(b.payment_amount || 0), 0);
            const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0;

            return {
                hall_id: h.hall_id,
                hall_name: h.hall_name,
                status: h.status,
                rating: avgRating.toFixed(1),
                bookingCount: bookings.length,
                totalAmount: totalAmount.toFixed(2)
            };
        });

        res.render('p_admin/halls', { halls: hallsData });
    } catch (err) {
        console.error(err);
        res.send('Ошибка загрузки залов');
    }
};

// ===== Календарь =====
export const getAdminCalendar = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const bookings = await Booking.findAll({ where: { date: today }, include: [BanquetHall] });

        const calendar = bookings.map(b => ({
            hall_name: b.banquetHall ? b.banquetHall.hall_name : 'Без названия',
            count: 1
        }));

        res.render('p_admin/calendar', { calendar });
    } catch (err) {
        console.error(err);
        res.send('Ошибка загрузки календаря');
    }
};

export const getBookingsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) return res.status(400).json({
            success: false,
            message: 'Дата не указана'
        });

        const bookings = await Booking.findAll({
            where: { date },
            include: [BanquetHall]
        });

        const hallCounts = {};

        bookings.forEach(b => {
            const hallName = b.banquetHall ? b.banquetHall.hall_name : 'Без названия';
            hallCounts[hallName] = (hallCounts[hallName] || 0) + 1;
        });
        const calendar = Object.entries(hallCounts).map(([hall_name, count]) => ({
            hall_name,
            count
        }));
        res.json({
            success: true,
            calendar
        });
    } catch (err) {
        console.error('Ошибка загрузки бронирований:', err);
        res.status(500).json({ error: 'Ошибка загрузки бронирований' });
    }
};


export const getMonthlyBookings = async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(year, month, 1); // следующий месяц

        const bookings = await Booking.findAll({
            where: { date: { [Op.gte]: startDate, [Op.lt]: endDate },
        status: {[Op.in]:['confirmed', 'pending']} },
            include: [BanquetHall],
            order: [['start_time', 'ASC']]
        });

        const calendar = {};
        bookings.forEach(b => {
            const dayDate = new Date(b.date);
            const day = dayDate.toISOString().split('T')[0];
            if (!calendar[day]) calendar[day] = [];
            calendar[day].push({
                hall_name: b.banquetHall ? b.banquetHall.hall_name : 'Без названия',
                start_time: b.start_time,
                end_time: b.end_time,
                guest_count: b.guest_count,
                status: b.status
            });
        });

        res.json({ calendar });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки календаря' });
    }
};


// ===== Статистика =====
export const getAdminStats = async (req, res) => {
    try {
        const allBookings = await Booking.findAll({ include: [BanquetHall] });
        const totalBookings = allBookings.length;
        const totalRevenue = allBookings.reduce((sum, b) => sum + parseFloat(b.payment_amount || 0), 0).toFixed(2);

        // График по последним 7 дням
        const chartLabels = [];
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            chartLabels.push(dateStr);

            const count = allBookings.filter(b => b.date === dateStr).length;
            chartData.push(count);
        }

        res.render('p_admin/stats', {
            totalBookings,
            totalRevenue,
            chartLabels,
            chartData
        });
    } catch (err) {
        console.error(err);
        res.send('Ошибка загрузки статистики');
    }
};

export const createManager = async (req, res) => {
    try {
        const { first_name, last_name, login, password } = req.body;

        const existing = await User.findOne({
            where: { login }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким логином уже существует'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newManager = await User.create({
            role_id: 2,
            first_name,
            last_name,
            login,
            password: hashedPassword,
            status: "active",

        });

        res.status(201).json({
            success: true,
            message: 'Менеджер успешно зарегистрирован',
            user: newManager
        });
    } catch (err) {
        console.error("Ошибка при создании менеджера:", err);
        res.status(500).json({ error: "Ошибка при создании менеджера" });
    }
};


//====DELETE USER
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });

        await user.destroy(); res.json({ message: "Пользователь успешно удалён" });
    } catch (err) {
        console.error("Ошибка при удалении пользователя:", err);
        res.status(500).json({ error: "Ошибка при удалении пользователя" });
    }
};


export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });

        user.status = status;
        await user.save();

        res.json({
            success: true,
            message: "Статус успешно обновлён"
        });
    } catch (err) {
        console.error("Ошибка при обновлении статуса:", err);
        res.status(500).json({ error: "Ошибка при обновлении статуса", err });
    }
}



function translateRole(role) {
    switch (role) {
        case "admin": return "Администратор";
        case "manager": return "Менеджер";
        case "client": return "Клиент";
        default: return "Неизвестно";
    }
}

function translateStatus(status) {
    switch (status) {
        case "active": return "Активен";
        case "blocked": return "Заблокирован";
        default: return "Неизвестно";
    }
}


export const getHallById = async (req, res) => {
    try {
        const hall = await BanquetHall.findByPk(req.params.id, {
            include: [{ model: User, as: 'manager' }]
        });

        if (!hall) return res.status(404).json({ error: 'Зал не найден' });

        res.json({
            id: hall.hall_id,
            hall_name: hall.hall_name,
            description: hall.description,
            capacity: hall.capacity,
            price: hall.price,
            address: hall.address,
            rating: hall.rating,
            status: hall.status,
            image_path: hall.image_path, // URL фото
            managerFullName: hall.manager ? `${hall.manager.first_name} ${hall.manager.last_name}` : '—'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

export const updateHallStatus = async (req, res) => {
    try {
        const { hallId } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Некорректный статус'
            });
        }

        const hall = await BanquetHall.findByPk(hallId);
        if (!hall) return res.status(404).json({
            success: false,
            message: 'Зал не найден'
        });

        hall.status = status;
        await hall.save();
        res.json({
            success: true,
            message: 'Статус успешно обновлён',
            status: hall.status
        });
    } catch (err) {
        console.error('Ошибка при обновлении статуса:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};


export const getDashboardData = async (req,res)=>{
    try{
        const year = new Date().getFullYear();
        const startDate = new Date(`${year}-01-01`);const endDate = new Date(`${year+1}-01-01`);

        const bookings = await Booking.findAll({
            where: { date: { [Op.gte]: startDate, [Op.lt]: endDate } },
            include: [BanquetHall]
        });

        const months = Array.from({length:12},(_,i)=>new Date(year,i,1).toLocaleString('ru-RU',{month:'long'}));
        const bookingsPerMonth = Array(12).fill(0);
        const guestsPerMonth = Array(12).fill(0);
        const statusCounts = { confirmed:0, pending:0, cancelled:0 };

        const hallMap = {};

        bookings.forEach(b => {
            const month = b.date.getMonth();
            bookingsPerMonth[month]++;
            guestsPerMonth[month]+=b.guest_count;

            statusCounts[b.status] = (statusCounts[b.status] || 0)+1;

            const hallName = b.banquetHall ? b.banquetHall.hall_name : 'Без названия';
            hallMap[hallName] = (hallMap[hallName] || 0)+1;
        });

        // Топ-5 залов
        const topHalls = Object.entries(hallMap)
            .map(([hall_name,count])=>({hall_name,count}))
            .sort((a,b)=>b.count-a.count)
            .slice(0,5);

        res.json({ months, bookingsPerMonth, guestsPerMonth, statusCounts, topHalls });

    } catch(err) {
        console.error(err);
        res.status(500).json({error:'Ошибка получения данных'});
    }
};

export const exportDashboard = async (req,res)=>{
    try{
        const wordBuffer = await WordExporter.generateDashboard();
        res.setHeader('Content-Disposition', 'attachment; filename = "statistics.docx"');
        res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(wordBuffer);
    } catch(err){
        console.error(err);
        res.status(500).json({error:'Ошибка экспорта'});
    }
}
