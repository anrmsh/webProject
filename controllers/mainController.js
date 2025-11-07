
import { Op } from 'sequelize';
import { BanquetHall, Booking } from '../models/index.js';

export const showHomePage = async (req, res) => {
  try {
    const { search, date, capacityMin, capacityMax, sort } = req.query;

    const where = { status: 'approved' };

    if (search) {
      where.hall_name = { [Op.like]: `%${search}%` };
    }

    if (capacityMin || capacityMax) {
      where.capacity = {};
      if (capacityMin) where.capacity[Op.gte] = Number(capacityMin);
      if (capacityMax) where.capacity[Op.lte] = Number(capacityMax);
    }

    let excludeHallIds = [];
    if (date) {
      const bookings = await Booking.findAll({
        where: { date, status: { [Op.not]: 'cancelled' } },
        attributes: ['hall_id']
      });
      excludeHallIds = bookings.map(b => b.hall_id);
      if (excludeHallIds.length > 0) {
        where.hall_id = { [Op.notIn]: excludeHallIds };
      }
    }

    let order = [];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    else if (sort === 'price_desc') order = [['price', 'DESC']];
    else if (sort === 'rating_asc') order = [['rating', 'ASC']];
    else if (sort === 'rating_desc') order = [['rating', 'DESC']];

    const halls = await BanquetHall.findAll({ where, order, limit: 6 });

    res.render('index', {
    halls,
    user: req.user || null
  });
  } catch (err) {
    console.error('Ошибка при загрузке залов:', err);
    res.status(500).send('Ошибка при загрузке страницы.');
  }
};
