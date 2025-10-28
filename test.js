// test.js
import { sequelize } from './config/database.js';
import { BanquetHall } from './models/index.js';

try {
    // Проверяем подключение
    await sequelize.authenticate();
    console.log('✅ Подключение к БД установлено!');

    // Получаем все залы из таблицы banquetHall
    const halls = await BanquetHall.findAll({
        attributes: ['hall_id', 'hall_name', 'capacity', 'price', 'status'], // выводим только нужные поля
        order: [['price', 'ASC']] // сортировка по цене (по возрастанию)
    });

    // Проверяем, есть ли данные
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
