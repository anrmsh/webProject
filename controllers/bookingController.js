import { BanquetHall, Booking, Service, WaitingList, EventType, Client } from "../models/index.js";

import { Op } from 'sequelize';

export const getHallDetails = async (req, res) => {
    const hallId = req.params.id;

    const hall = await BanquetHall.findByPk(hallId);
    const services = await Service.findAll();
    const eventTypes = await EventType.findAll();

    const bookings = await Booking.findAll({
        where: { hall_id: hallId, status: { [Op.not]: 'cancelled' } }, attributes: ['date']
    });

    const disabledDates = bookings.map(b => b.date);

    const recommendations = await BanquetHall.findAll({
        where: { hall_id: { [Op.ne]: hallId }, status: 'approved' },
        limit: 3
    });

    res.render('hall/hallCard', { hall, services, disabledDates, recommendations, eventTypes });

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
        const {
            hall_id,
            date,
            start_time,
            end_time,
            guest_count,
            services,
            event_type_id
        } = req.body;

        const client = await Client.findOne({ where: { user_id: req.user.user_id } });


        //const client_id = req.user.user_id;

        const conflict = await Booking.findOne({
            where: {
                hall_id,
                date,
                [Op.and]: [
                    {
                        start_time: { [Op.lt]: end_time }
                    },
                    {
                        end_time: { [Op.gt]: start_time }
                    }
                ],


            }
        });

        if (conflict) {

            return res.status(400).json({
                success: false,
                message: 'На это время зал уже занят! Можете записаться в лист ожидания'
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

        let eventTypeValue = null;
        if (event_type_id && event_type_id !== "other") {
            const maybeId = parseInt(event_type_id, 10);
            if (!isNaN(maybeId)) eventTypeValue = maybeId;
        }

        await Booking.create({
            client_id: client.client_id,
            hall_id,
            date,
            start_time,
            end_time,
            guest_count,
            payment_amount: total,
            status: 'pending',
            event_type_id: eventTypeValue,
        });

        res.json({
            success: true,
            message: 'Бронирование успешно создано!',
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: 'Ошибка при создании бронирования',
        });
    }
};


export const addToWaitingList = async (req, res) => {
    try {
        const { hall_id, date, start_time, end_time } = req.body;
        const client = await Client.findOne({ where: { user_id: req.user.user_id } });

        if (!client) {
            return res.status(400).json({ success: false, message: 'Клиент не найден' });
        }

        const position = (await WaitingList.count({ where: { hall_id } })) + 1;

        await WaitingList.create({
            client_id: client.client_id,
            hall_id,
            desired_date: date,
            start_time,
            end_time,
            queue_position: position,
        });

        res.json({
            success: true,
            message: `Вы добавлены в лист ожидания! Ваша позиция — ${position}.`,
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

export async function autoCancelBookings(req, res) {
    try {

        const [affectedCount] = await Booking.update(
            { status: 'cancelled' },
            {
                where: {
                    status: 'pending',
                    date: {
                        [Op.lte]: new Date(new Date().setDate(new Date().getDate() + 1))
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
};

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

        
        booking.date = date;
        booking.start_time = start_time;
        booking.end_time = end_time;
        booking.guest_count = guest_count;

        let total = parseFloat(booking.banquetHall.price);
        if (Array.isArray(services)) {
            const selectedServices = services
                ? await Service.findAll({ where: { service_id: services } })
                : [];
            total += selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0);

        }
        console.log(total);
        booking.payment_amount = total;
        booking.from_waiting_list = false;

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
        const { hall_id, date } = req.query;

        const hallBookings = await Booking.findAll({
            where: {
                hall_id,
                date,
                status: { [Op.ne]: "cancelled" },
            },
            attributes: ["start_time", "end_time"],
        });

        let fullDayBooked = false;
        if (hallBookings.length) {

            const sorted = hallBookings
                .map(b => [b.start_time, b.end_time])
                .sort((a, b) => (a[0] < b[0] ? -1 : 1));

            let merged = [sorted[0]];
            for (let i = 1; i < sorted.length; i++) {
                const last = merged[merged.length - 1];
                if (sorted[i][0] <= last[1]) {
               
                    last[1] = last[1] > sorted[i][1] ? last[1] : sorted[i][1];
                } else {
                    merged.push(sorted[i]);
                }
            }

          
            fullDayBooked = merged.some(([start, end]) => start <= "00:00" && end >= "23:59");
        }

        res.json({ slots: hallBookings, fullDayBooked });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка загрузки бронирований" });
    }
};


export const checkBookingAvailability = async (req, res) => {
    try {
        const {
            hall_id,
            date,
            start_time,
            end_time
        } = req.query;

        const conflict = await Booking.findOne({
            where: {
                hall_id,
                date,
                status: { [Op.ne]: 'cancelled' },
                [Op.or]: [
                    { start_time: { [Op.between]: [start_time, end_time] } },
                    { end_time: { [Op.between]: [start_time, end_time] } },
                    {
                        [Op.and]: [
                            { start_time: { [Op.lte]: start_time } },
                            { end_time: { [Op.gte]: end_time } },
                        ],
                    },
                ],
            },
        });

        res.json({ conflict: !!conflict });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка проверки занятости" });
    }
};





