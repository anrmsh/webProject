import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Booking = sequelize.define('booking', {
  booking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hall_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  guest_count: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'waiting_list'),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'), defaultValue: 'unpaid'
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0
  },
   from_waiting_list: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
   }
}, {
  tableName: 'booking',
  timestamps: false
});
