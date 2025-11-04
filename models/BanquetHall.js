// models/BanquetHall.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const BanquetHall = sequelize.define('banquetHall', {
  hall_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hall_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'inactive'), defaultValue: 'pending'
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  image_path: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'banquetHall',
  timestamps: false
});
