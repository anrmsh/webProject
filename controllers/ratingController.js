import { Rating, BanquetHall, Client } from "../models/index.js";

export const rateHall = async (req, res) => {
    const { hallId, score } = req.body;
    const userId = req.user.user_id;

    try {
        const client = await Client.findOne({
            where: {
                user_id: userId
            }
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Клиент не найден',
            });
        }
 
        const clientId = client.client_id;

        let rating = await Rating.findOne({
            where: {
                client_id: clientId,
                hall_id: hallId
            }
        });

        if (rating) {
            rating.score = score;
            await rating.save();
        } else {
            await Rating.create({
                client_id: clientId,
                hall_id: hallId,
                score: score,
            });
        }

        const allRatings = await Rating.findAll({
            where: {
                hall_id: hallId
            }
        });

        const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

        const hall = await BanquetHall.findByPk(hallId);
        hall.rating = avgRating;
        hall.save();
        res.status(201).json({
            success: true,
            message: 'Оценка сохранена', avgRating
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}