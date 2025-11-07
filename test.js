
import { sequelize } from './config/database.js';
import { BanquetHall } from './models/index.js';

try {

    await sequelize.authenticate();
    console.log('✅ Подключение к БД установлено!');

   
    const halls = await BanquetHall.findAll({
        attributes: ['hall_id', 'hall_name', 'capacity', 'price', 'status'], 
        order: [['price', 'ASC']] 
    });


    if (halls.length === 0) {
        console.log('⚠️ В базе данных пока нет залов.');
    } else {
        console.log(`📋 Найдено залов: ${halls.length}\n`);
        halls.forEach(hall => {
            console.log(
                `🏠 ID: ${hall.hall_id}\n` +
                `Название: ${hall.hall_name}\n` +
                `Вместимость: ${hall.capacity} гостей\n` +
                `Цена: ${hall.price} BYN\n` +
                `Статус: ${hall.status}\n` +
                `-------------------------------`
            );
        });
    }
} catch (error) {
    console.error('❌ Ошибка при работе с БД:', error.message);
} finally {
    await sequelize.close();
    console.log('🔌 Соединение закрыто.');
}
