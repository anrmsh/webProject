import { BanquetHall, Booking, Client, User, WaitingList } from '../models/index.js';
import bcrypt from 'bcrypt';

import dayjs from 'dayjs';

export const getProfilePage = async (req, res) => {
    try {
        if (!req.user) return res.redirect('/login');

        const user = await User.findOne({
            where: { user_id: req.user.user_id }
        })

        const client = await Client.findOne({ where: { user_id: req.user.user_id } });
        if (!client) return res.send('Клиент не найден');

        // Получаем все бронирования этого клиента
        const bookings = await Booking.findAll({
            where: { client_id: client.client_id },
            include: [{ model: BanquetHall, as: 'banquetHall' }],
            order: [['date', 'ASC']]
        });

        const today = dayjs();

        const bookingsWithEditable = bookings.map(b => {
            const eventDate = dayjs(b.date);
            const daysToEvent = eventDate.diff(today, 'day');

            return {
                ...b.toJSON(),
                editable: daysToEvent > 7,
                confirmable: daysToEvent <= 7 && daysToEvent >= 0 && b.status === 'pending',
                daysToEvent,
                from_waiting_list: b.from_waiting_list

            }
        });

        const waitingListItems = await WaitingList.findAll({
            where: { client_id: client.client_id },
            include: [{ model: BanquetHall }],
            order: [['queue_position', 'ASC']]
        });

        const waitingListFormatted = waitingListItems.map(w => ({
            ...w.toJSON(),
            status: 'waiting_list',
            position: w.queue_position,
            date: w.desired_date,
            start_time: w.start_time,
            end_time:  w.end_time,
            guest_count: null,
            editable: true
        }));

        // Формируем уведомления
        const notifications = bookings.flatMap(booking => {
            const today = dayjs();
            const eventDate = dayjs(booking.date);
            const confirmDate = eventDate.subtract(7, 'day');
            const daysToEvent = eventDate.diff(today, 'day');

            const notif = [];

            if (daysToEvent > 0 & daysToEvent <= 3) {

                notif.push(`Событие "${booking.banquetHall.hall_name}" через ${daysToEvent} дня!`);
            }


            if (confirmDate.diff(today, 'day') <= 7 && confirmDate.diff(today, 'day') > 0 && booking.status === 'pending') {
                notif.push(`Подтвердите бронирование "${booking.banquetHall.hall_name}" ${booking.date} за 7 дней до мероприятия`);
            }

            if(booking.from_waiting_list){
                notif.push(`Ваша бронь на "${booking.banquetHall.hall_name}" ${booking.date} была подтверждена из листа ожидания!`);
            }
            return notif;
        });

        // Передаем обе переменные в EJS
        console.log('Client:', client);
        console.log(req.user.user_id);
        res.render('profile', {
            user,
            client,
            bookings: bookingsWithEditable,
            waitingList: waitingListFormatted,
            notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера' + err);
    }
};


export const getEditProfile = async (req, res) => {
    try {
        if (!req.user) return res.render('message', {
            title: 'Ошибка',
            message: 'Вы должны войти в систему, чтобы забронировать зал',
            link: '/login'
        });

        const client = await Client.findOne({
            where: { user_id: req.user.user_id },
            include: [User]
        });
        res.render('p_user/editProfile', { client });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
}

export const postEditProfile = async (req, res) => {
    try {
        if (!req.user) return res.status(401).send('Вы не авторизованы');

        const { first_name, last_name, phone, login } = req.body;

        const user = await User.findByPk(req.user.user_id);
        const client = await Client.findOne({
            where: { user_id: req.user.user_id }
        });

        if (!user || !client) return res.status(404).send('Профиль не найден');

        if (login && login !== user.login) {
            const existingUser = await User.findOne({ where: { login } });
            if (existingUser) {
                return res.status(400).send('Пользователь с таким логином уже существует');
            }
            user.login = login;
        }

        // Обновляем только изменённые данные
        if (first_name && first_name !== user.first_name) user.first_name = first_name;
        if (last_name && last_name !== user.last_name) user.last_name = last_name;
        if (phone && phone !== client.phone) client.phone = phone;

        await user.save();
        await client.save();

        res.status(200).send('OK');

        //res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при обновлении профиля');
    }
};

export const postChangePassword = async (req, res) => {
    try {
        if (!req.user) return res.status(401).send('Вы не авторизованы');

        const { oldPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.user_id);

        if (!user) return res.status(404).send('Пользователь не найден');

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).send('Старый пароль неверен');

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        res.status(200).send('Пароль обновлён');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
};

export const getEditBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findByPk(bookingId, {
            include: [{ model: BanquetHall, as: 'hall' }]
        });

        if (!booking) return res.send('Бронь не найдена');

        const today = dayjs();
        if (dayjs(booking.date).diff(today, 'day') <= 7) {
            return res.send('Изменение брони невозможно за 7 дней до мероприятия');
        }

        res.render('edit-booking', { booking });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
};


export const postEditBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { hallId, date, startTime, endTime, guestCount } = req.body;

        const today = dayjs();
        if (dayjs(date).diff(today, 'day') <= 7) {
            return res.send('Изменение брони невозможно за 7 дней до мероприятия');
        }

        await Booking.update(
            { hallId, date, startTime, endTime, guestCount },
            { where: { booking_id: bookingId } }
        );

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
};


export const cancelWaiting = async (req, res) => {
    try {
        const  waitingId  = req.params.id;
        const waitingItem = await WaitingList.findByPk(waitingId);

        if (!waitingItem) {
            return res.status(404).json({
                message: 'Запись не найдена'
            });
        }

        await waitingItem.destroy();
        res.json({
            message: 'Вы успешно отказались от листа ожидания'
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}
