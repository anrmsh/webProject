import { sequelize } from "../config/database.js";
import { Role } from "./Role.js";
import { User } from './User.js';
import { Client } from './Client.js';
import { BanquetHall } from './BanquetHall.js';
import { Booking } from './Booking.js';
import { Service } from './Service.js';
import { BookingService } from './BookingService.js';
import { Rating } from './Rating.js';
import { WaitingList } from './WaitingList.js';
import { EventType } from './EventType.js';
import { Report } from './Report.js';
   
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

User.hasOne(Client, { foreignKey: 'user_id' });
Client.belongsTo(User, { foreignKey: 'user_id' });
 
User.hasMany(BanquetHall, { foreignKey: 'manager_id' });
BanquetHall.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });

Client.hasMany(Booking, { foreignKey: 'client_id' });
Booking.belongsTo(Client, { foreignKey: 'client_id' });

BanquetHall.hasMany(Booking, { foreignKey: 'hall_id' });
Booking.belongsTo(BanquetHall, { foreignKey: 'hall_id' });


Booking.belongsToMany(Service, {
    through: BookingService,
    foreignKey: 'booking_id',
});
Service.belongsToMany(Booking, {
    through: BookingService,
    foreignKey: 'service_id',
});


Client.hasMany(Rating, { foreignKey: 'client_id' });
Rating.belongsTo(Client, { foreignKey: 'client_id' });

BanquetHall.hasMany(Rating, { foreignKey: 'hall_id' });
Rating.belongsTo(BanquetHall, { foreignKey: 'hall_id' });

Client.hasMany(WaitingList, { foreignKey: 'client_id' });
WaitingList.belongsTo(Client, { foreignKey: 'client_id' });

BanquetHall.hasMany(WaitingList, { foreignKey: 'hall_id' });
WaitingList.belongsTo(BanquetHall, { foreignKey: 'hall_id' });

Booking.hasMany(BookingService, { foreignKey: 'booking_id' });
BookingService.belongsTo(Booking, { foreignKey: 'booking_id' });

Service.hasMany(BookingService, { foreignKey: 'service_id' });
BookingService.belongsTo(Service, { foreignKey: 'service_id' });


EventType.hasMany(Booking, { foreignKey: 'event_type_id' });
Booking.belongsTo(EventType, { foreignKey: 'event_type_id' });


User.hasMany(Report, {
    foreignKey: 'manager_id',
    as: 'reports',
    onDelete: 'CASCADE'
});

// Каждый отчёт принадлежит менеджеру
Report.belongsTo(User, {
    foreignKey: 'manager_id',
    as: 'manager'
});


try {
    await sequelize.authenticate();
    console.log(' Подключение к базе данных успешно установлено');
} catch (error) {
    console.error(' Ошибка подключения к базе данных:', error);
}


export {
    Role,
    User,
    Client,
    BanquetHall,
    Booking,
    Service,
    BookingService,
    Rating,
    WaitingList,
    EventType,
    Report
};