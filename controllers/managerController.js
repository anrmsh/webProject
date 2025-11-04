import { Sequelize } from "sequelize";
import { BanquetHall, Booking, EventType, Rating, User, Client } from "../models/index.js";
const { Op } = Sequelize;

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
            where: {
                hall_id: hallId,
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


export const getRatingsPage = async (req, res) => {
    const managerId = req.user.user_id;
    const halls = await BanquetHall.findAll({
        where: { manager_id: managerId }
    });

    res.render('p_manager/rating', {
        halls,
        currentDate: new Date().toLocaleDateString("ru-RU"),
    });
};

export const getRatingsData = async (req, res) => {
    const managerId = req.user.user_id;
    const { hall } = req.query;
    const halls = await BanquetHall.findAll({
        where: { manager_id: managerId },
        attributes: ['hall_id']
    });
    const hallIds = halls.map(h => h.hall_id);

    const where =
        hall !== 'all'
            ? { hall_id: hall }
            : { hall_id: { [Op.in]: hallIds } };


    const ratings = await Rating.findAll({ where });

    const count = ratings.length;
    const avgRating = count ? (ratings.reduce((sum, r) => sum + r.score, 0) / count) : 0;



    const distribution = {};
    for (let i = 1; i <= 5; i++) {
        distribution[i] = 0;
    }
    ratings.forEach(r => distribution[r.score]++);

    const recent = ratings.filter(r =>
        new Date(r.created_at) >= new Date(Date.now() - 30 * 24 * 3600 * 1000)
    ).length;

    const trendRaw = await Rating.findAll({
        where,
        attributes: [
            [Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"), "month"],
            [Sequelize.fn("AVG", Sequelize.col("score")), "avg"]
        ],
        group: ["month"],
        order: [["month", "ASC"]],
    });

    const trend = trendRaw.map(t => ({
        month: t.get("month"),
        avg: parseFloat(t.get("avg")),
    }));

    res.json({ count, avgRating, distribution, recent, trend });
};


export const getManagerBookings = async (req, res) => {
    try {

        const managerId = req.user.user_id;
        const { hallId, date } = req.query;
        if (!hallId || !date) {
            return res.status(400).json({
                message: 'hallId и date обязательны'
            });
        }

        const hall = await BanquetHall.findOne({
            where: { hall_id: hallId, manager_id: managerId }
        });
        if (!hall) {
            return res.status(403).json({ message: 'Зал не найден или недоступен' });
        }

        const bookings = await Booking.findAll({
            where: {
                hall_id: hallId,
                date: date
            },
            include: [
                {
                    model: Client,
                    attributes: ['client_id', 'phone'],
                    include: [
                        {
                            model: User,
                            attributes: ['first_name', 'last_name']
                        }
                    ]
                },
                {
                    model: EventType,
                    attributes: ['type_name']
                },
                {
                    model: BanquetHall,
                    attributes: ['hall_id', 'hall_name']
                }
            ],
            order: [['start_time', 'ASC']]
        });

        const result = bookings.map(b => ({
            booking_id: b.booking_id,
            start_time: b.start_time,
            end_time: b.end_time,
            guest_count: b.guest_count,
            status: b.status,
            payment_status: b.payment_status,
            payment_amount: b.payment_amount,
            client: {
                first_name: b.client?.user?.first_name || '',
                last_name: b.client?.user?.last_name || '',
                phone: b.client?.phone || ''
            },
            event_type: {
                name: b.event_type?.type_name || null
            },
            hall: {
                hall_id: b.banquetHall?.hall_id || '-',
                hall_name: b.banquetHall?.hall_name || '-'
            }

        }));

        res.json({
            bookings: result
        })

    } catch (err) {
        console.error('Ошибка при получении бронирований:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

export const getManagerShedulePage = async (req, res) => {
    try {
        const managerId = req.user.user_id;

        const halls = await BanquetHall.findAll({
            where: {
                manager_id: managerId
            },
            attributes: ['hall_id', 'hall_name']
        });

        res.render('p_manager/shedule', {
            halls,
            currentDate: new Date().toISOString().slice(0, 10)
        });
    } catch (err) {
        console.error('Ошибка при загрузке страницы расписания:', err);
        res.status(500).send('Ошибка сервера при загрузке расписания');
    }
};

export const getRegisterHallPage = async (req, res) => {
    try {

        const managerId = req.user.user_id;
        const manager = await User.findByPk(managerId);
        const managerName = `${manager.first_name} ${manager.last_name}`;
        res.render('p_manager/register-hall', { managerName });

    } catch (err) {
        console.error('Ошибка при загрузке страницы регистрации зала:', err);
        res.status(500).send('Ошибка сервера');
    }
}

export const postRegisterHall = async (req, res) => {
    try {
        const { hall_name, description, capacity, price, address, image_path } = req.body;
        const manager_id = req.user.user_id;

        if (!hall_name || !capacity || !price || !address) {
            return res.status(400).send('Пожалуйста, заполните все обязательные поля.');
        }

        await BanquetHall.create({
            hall_name,
            description,
            capacity,
            price,
            address,
            manager_id,
            image_path,
            status: 'pending'
        });

        res.json({
            success: true,
            title: 'Успех!',
            message: 'Банкетный зал успешно зарегистрирован.'
        });
    } catch (err) {
        console.error('Ошибка при регистрации зала:', err);
        res.status(500).json({
            success: false,
            title: 'Ошибка сервера',
            message: 'Не удалось зарегистрировать зал. Попробуйте позже.'
        });
    }
}