
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Rating = sequelize.define('rating', {
  rating_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  hall_id: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'rating',
  timestamps: false
});
