// models/WaitingList.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const WaitingList = sequelize.define('waiting_list', {
  waiting_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  hall_id: { type: DataTypes.INTEGER, allowNull: false },
  desired_date: { type: DataTypes.DATEONLY, allowNull: false },
  desired_time: { type: DataTypes.TIME, allowNull: false },
  queue_position: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('active','notified'), defaultValue: 'active' }
}, {
  tableName: 'waiting_list',
  timestamps: false
});
