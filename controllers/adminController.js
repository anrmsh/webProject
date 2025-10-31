import { User, Role, BanquetHall, Booking, Rating } from '../models/index.js';

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
            const name = b.BanquetHall ? b.BanquetHall.hall_name : 'Без названия';
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
        const users = await User.findAll({ include: Role });
        const usersData = users.map(u => ({
            user_id: u.user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            roleName: u.Role ? u.Role.role_name : 'Неизвестно',
            status: u.status,
        }));
        res.render('p_admin/users', { users: usersData });
    } catch (err) {
        console.error(err);
        res.send('Ошибка загрузки пользователей');
    }
};

// ===== Залы =====
export const getAdminHalls = async (req, res) => {
    try {
        const halls = await BanquetHall.findAll({
            include: [Booking, Rating]
        });

        const hallsData = halls.map(h => {
            const bookings = h.Bookings || [];
            const ratings = h.Ratings || [];
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
            hall_name: b.BanquetHall ? b.BanquetHall.hall_name : 'Без названия',
            count: 1
        }));

        res.render('p_admin/calendar', { calendar });
    } catch (err) {
        console.error(err);
        res.send('Ошибка загрузки календаря');
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
