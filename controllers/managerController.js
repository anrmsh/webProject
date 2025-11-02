import { Sequelize } from "sequelize";
import { BanquetHall, Booking, Rating, User } from "../models/index.js";


export const getManagerHomePage = async (req, res) => {
    try {
        const managerId = req.user.user_id;
        const manager = await User.findByPk(managerId);

        const halls = await BanquetHall.findAll({
            where: { manager_id: manager.user_id }
        });


        const managerName = manager.first_name;
        const managerLastName = manager.last_name;
        const currentDate = new Date().toLocaleDateString('ru-RU');

        res.render('p_manager/manager', {
            managerName,
            managerLastName,
            currentDate,
            halls
        })

    } catch (err) {
        console.error('Ошибка загрузки панели менеджера:', err);
        res.status(500).send('Ошибка загрузки панели менеджера');
    }
};

export const getHallStats = async (req, res) => {
    try {
        const hallId = req.params.hallId;

        const bookingsCount = await Booking.count({ 
            where: { hall_id: hallId,
                status: 'confirmed'
             } 
        });
        const guestsCount = await Booking.sum('guest_count', { where: { hall_id: hallId } });
        const averageRating = await Rating.findOne({
            where: { hall_id: hallId },
            attributes: [[Sequelize.fn('AVG', Sequelize.col('score')), 'avg']]
        });
        const revenueSum = await Booking.sum('payment_amount', { where: { hall_id: hallId } });

        const statusCounts = {
            confirmed: await Booking.count({ where: { hall_id: hallId, status: 'confirmed' } }),
            pending: await Booking.count({ where: { hall_id: hallId, status: 'pending' } }),
            cancelled: await Booking.count({ where: { hall_id: hallId, status: 'cancelled' } })
        };




        const bookingsByMonth = await Booking.findAll({
            where: { hall_id: hallId },
            attributes: [
                [Sequelize.fn('MONTH', Sequelize.col('date')), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('booking_id')), 'count']
            ],
            group: ['month'],
            order: [[Sequelize.fn('MONTH', Sequelize.col('date')), 'ASC']]
        });

        res.json({
            bookingsCount,
            guestsCount,
            averageRating: averageRating?.dataValues.avg
                ? Number(averageRating.dataValues.avg).toFixed(1)
                : 0,
            revenueSum: revenueSum || 0,
            statusCounts,
            bookingsByMonth
        });
    } catch (err) {
        console.error('Ошибка статистики:', err);
        res.status(500).json({ error: 'Ошибка статистики' });
    }
};

