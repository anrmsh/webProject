import { DataTypes } from "sequelize";
import { sequelize } from '../config/database.js';

export const EventType = sequelize.define('event_type',{
    event_type_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
},{
    tableName: 'event_type',
    timestamps: false
});

