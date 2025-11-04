import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Report = sequelize.define('report', {
    report_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    manager_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    report_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    period_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    period_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    report_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Агрегированные данные по залам и бронированиям'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'report',
    timestamps: false
});
