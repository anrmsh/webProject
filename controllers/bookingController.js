import { BanquetHall, Booking, Service, WaitingList, Client } from "../models/index.js";

import { Op } from 'sequelize';

export const getHallDetails = async (req, res) => {
    const hallId = req.params.id;

    const hall = await BanquetHall.findByPk(hallId);
    const services = await Service.findAll();

    const bookings = await Booking.findAll({
        where: { hall_id: hallId, status: { [Op.not]: 'cancelled' } }, attributes: ['date']
    });

    const disabledDates = bookings.map(b => b.date);

    const recommendations = await BanquetHall.findAll({
        where: { hall_id: { [Op.ne]: hallId }, status: 'approved' },
        limit: 3
    });

    res.render('hall/hallCard', { hall, services, disabledDates, recommendations });

};

export const createBooking = async (req, res) => {
    try {

        if (!req.user) {
            return res.render('message', {
                title: 'Ошибка',
                message: 'Вы должны войти в систему, чтобы забронировать зал',
                link: '/login'
            });
        }
        const { hall_id, date, start_time, end_time, guest_count, services } = req.body;

        const client = await Client.findOne({ where: { user_id: req.user.user_id } });

        //const client_id = req.user.user_id;

        const conflict = await Booking.findOne({
            where: {
                hall_id,
                date,
                [Op.or]: [
                    { start_time: { [Op.between]: [start_time, end_time] } },
                    { end_time: { [Op.between]: [start_time, end_time] } }
                ]
            }
        });

        if (conflict) {
            // return res.json({
            //     success: false, message: 'На это время зал уже занят! Можете записаться в лист ожидания'
            // });
            return res.render('message', {
                title: 'Ошибка',
                message: 'На это время зал уже занят! Можете записаться в лист ожидания',
                link: '/halls/' + hall_id
            });
        }

        const hall = await BanquetHall.findByPk(hall_id);
        let total = parseFloat(hall.price);

        if (Array.isArray(services)) {
            const selected = await Service.findAll({
                where: { service_id: services }
            })
            total += selected.reduce((sum, s) => sum + parseFloat(s.price), 0);
        }

        await Booking.create({
            client_id: client.client_id,
            hall_id,
            date,
            start_time,
            end_time,
            guest_count,
            payment_amount: total,
            status: 'pending'
        });

        // res.json({
        //     success: true,
        //     message: 'Бронирование успешно создано!'
        // });

        res.render('message', {
            title: 'Успех',
            message: 'Бронирование успешно создано!',
            link: '/halls/' + hall_id
        });
    } catch (err) {
        console.error(err);
        // res.status(500).json({
        //     success: false,
        //     message: 'Ошибка при бронировании'
        // })

        res.render('message', {
            title: 'Ошибка',
            message: 'Произошла ошибка при бронировании',
            link: '/halls'
        });
    }
};


export const addToWaitingList = async (req, res) => {
    try {
        const { client_id, hall_id, date, start_time } = req.body;

        const position = await WaitingList.count({
            where: { hall_id }
        }) + 1;

        await WaitingList.create({
            client_id,
            hall_id,
            desired_date: date,
            desired_time: start_time,
            queue_position: position
        });

        res.status(401).json({
            success: true,
            message: 'Вы добавлены в лист ожидания!'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка при добавлении в лист ожидания.' });
    }
};


export const updateStatusBookingConfirm = async (req, res) => {
    const bookingId = req.params.id;
    try {
        const booking = await Booking.findOne({
            where: {
                booking_id: bookingId,
                status: { [Op.ne]: 'confirmed' }
            }
        });

        if (!booking) {
            return res.status(400).json({
                success: false,
                message: 'Бронь не найдена или уже подтверждена'
            })
        }

        booking.status = 'confirmed';
        await booking.save();
        res.json({ message: 'Бронь успешно подтверждена' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
};

export async function cancelBooking(req, res) {
    try {
        const bookingId = req.params.id;

        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Бронь не найдена' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({ message: 'Бронь успешно отменена' });
    } catch (err) {
        console.error('Ошибка при отмене:', err);
        res.status(500).json({ message: 'Ошибка сервера при отмене' });
    }
}

// ✅ Автоматическая отмена за 1 день до мероприятия
export async function autoCancelBookings(req, res) {
    try {
        // Найдём все неподтверждённые брони, у которых дата сегодня или завтра
        const [affectedCount] = await Booking.update(
            { status: 'cancelled' },
            {
                where: {
                    status: 'pending',
                    date: {
                        [Op.lte]: new Date(new Date().setDate(new Date().getDate() + 1)) // сегодня или завтра
                    }
                }
            }
        );

        res.json({
            message: 'Автоматическая отмена выполнена',
            affected: affectedCount
        });
    } catch (err) {
        console.error('Ошибка при автоотмене:', err);
        res.status(500).json({ message: 'Ошибка при автоматической отмене' });
    }
}


//EDITING BOOKING
export const getBookingDetails = async (req, res) => {
    const bookingId = req.params.id;

    const booking = await Booking.findByPk(bookingId, {
        include: [
            { model: BanquetHall },
            { model: Client },
            { model: Service }
        ]
    });

    if (!booking) {
        return res.render('message', {
            title: 'Ошибка',
            message: 'Бронь не найдена',
            link: '/profile'
        });
    }

    const hall = await BanquetHall.findByPk(booking.hall_id);

    const hallBookings = await Booking.findAll({
        where: {
            hall_id: booking.hall_id,
            status: { [Op.ne]: 'cancelled' },
            booking_id: { [Op.ne]: booking.booking_id }
        },
        attributes: ['date', 'start_time', 'end_time']
    });

    const services = await Service.findAll();
    res.render('booking/bookingEdit', {
        booking,
        hall,
        hallBookings,
        services
    });
}

export const updateBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { date, start_time, end_time, guest_count, services } = req.body;

        const booking = await Booking.findByPk(bookingId,
            { include: [{ model: BanquetHall }] }
        );

        if (!booking) {
            return res.render('message', {
                title: 'Ошибка',
                message: 'Бронь не найдена',
                link: '/profile'
            });
        }

        const conflict = await Booking.findOne({
            where: {
                hall_id: booking.hall_id,
                date,
                booking_id: { [Op.ne]: booking.booking_id },
                [Op.or]: [
                    { start_time: { [Op.between]: [start_time, end_time] } },
                    { end_time: { [Op.between]: [start_time, end_time] } },
                    {
                        [Op.and]: [
                            { start_time: { [Op.lte]: start_time } },
                            { end_time: { [Op.gte]: end_time } }
                        ]
                    }
                ]
            }
        });

        if (conflict) {
            return res.render('message', {
                title: 'Ошибка',
                message: 'Выбранный слот уже занят',
                link: '/profile'
            });
        }

        // booking.date = date;
        booking.date = date;
        booking.start_time = start_time;
        booking.end_time = end_time;
        booking.guest_count = guest_count;

        // Рассчёт суммы с учётом услуг
        let total = parseFloat(booking.banquetHall.price);
        if (Array.isArray(services)) {
            const selectedServices = services
                ? await Service.findAll({ where: { service_id: services } })
                : [];
            total += selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0);

        }
        console.log(total);
        booking.payment_amount = total;

        await booking.save();

        res.render('message', {
            title: 'Успех',
            message: 'Бронь успешно обновлена!',
            link: '/profile'
        });

    } catch (err) {
        console.error(err);
        res.render('message', {
            title: 'Ошибка',
            message: 'Произошла ошибка при обновлении брони',
            link: '/profile'
        });
    }
}

export const getHallBookingsByDate = async (req, res) => {
    try {
        const { hall_id, date, booking_id } = req.query;

        const hallBookings = await Booking.findAll({
            where: {
                hall_id,
                date,
                status: { [Op.ne]: 'cancelled' },
                booking_id: { [Op.ne]: booking_id }
            },
            attributes: ['date', 'start_time', 'end_time']
        });

        res.json(hallBookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка загрузки бронирований' });
    }
};




