// models/Service.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Service = sequelize.define('service', {
  service_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  service_name: { type: DataTypes.STRING(100), allowNull: false },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false }
}, {
  tableName: 'service',
  timestamps: false 
});
