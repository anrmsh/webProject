import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const BookingService = sequelize.define('booking_service', {
  booking_service_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  service_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'booking_service',
  timestamps: false
});
