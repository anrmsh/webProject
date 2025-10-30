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
