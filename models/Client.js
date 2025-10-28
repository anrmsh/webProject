// models/Client.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Client = sequelize.define('client', {
  client_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  client_type: { type: DataTypes.ENUM('individual', 'corporate'), defaultValue: 'individual' },
  phone: { type: DataTypes.STRING(20), allowNull: true }
}, {
  tableName: 'client',
  timestamps: false
});
