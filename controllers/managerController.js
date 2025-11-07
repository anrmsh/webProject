import { Sequelize } from "sequelize";
import { BanquetHall, Booking, EventType, Rating, User, Client, Report, WaitingList } from "../models/index.js";
const { Op, fn, col, literal } = Sequelize;
import ExcelJS from "exceljs";

export const getManagerHomePage = async (req, res) => {
    try {
        const managerId = req.user.user_id;
        const manager = await User.findByPk(managerId);

        const halls = await BanquetHall.findAll({
            where: { manager_id: manager.user_id }
        });


        const managerName = manager.first_name;
        const managerLastName = manager.last_name;
        const currentDate = new Date().toLocaleDateString('ru-RU');

        res.render('p_manager/manager', {
            managerName,
            managerLastName,
            currentDate,
            halls
        })

    } catch (err) {
        console.error('Ошибка загрузки панели менеджера:', err);
        res.status(500).send('Ошибка загрузки панели менеджера');
    }
};

export const getHallStats = async (req, res) => {
    try {
        const hallId = req.params.hallId;

        const bookingsCount = await Booking.count({
            where: {
                hall_id: hallId,
                status: 'confirmed'
            }
        });
        const guestsCount = await Booking.sum('guest_count', { where: { hall_id: hallId } });
        const averageRating = await Rating.findOne({
            where: { hall_id: hallId },
            attributes: [[Sequelize.fn('AVG', Sequelize.col('score')), 'avg']]
        });
        const revenueSum = await Booking.sum('payment_amount', { where: { hall_id: hallId } });

        const statusCounts = {
            confirmed: await Booking.count({ where: { hall_id: hallId, status: 'confirmed' } }),
            pending: await Booking.count({ where: { hall_id: hallId, status: 'pending' } }),
            cancelled: await Booking.count({ where: { hall_id: hallId, status: 'cancelled' } })
        };




        const bookingsByMonth = await Booking.findAll({
            where: { hall_id: hallId },
            attributes: [
                [Sequelize.fn('MONTH', Sequelize.col('date')), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('booking_id')), 'count']
            ],
            group: ['month'],
            order: [[Sequelize.fn('MONTH', Sequelize.col('date')), 'ASC']]
        });

        res.json({
            bookingsCount,
            guestsCount,
            averageRating: averageRating?.dataValues.avg
                ? Number(averageRating.dataValues.avg).toFixed(1)
                : 0,
            revenueSum: revenueSum || 0,
            statusCounts,
            bookingsByMonth
        });
    } catch (err) {
        console.error('Ошибка статистики:', err);
        res.status(500).json({ error: 'Ошибка статистики' });
    }
};


export const getRatingsPage = async (req, res) => {
    const managerId = req.user.user_id;
    const halls = await BanquetHall.findAll({
        where: { manager_id: managerId }
    });

    res.render('p_manager/rating', {
        halls,
        currentDate: new Date().toLocaleDateString("ru-RU"),
    });
};

export const getRatingsData = async (req, res) => {
    const managerId = req.user.user_id;
    const { hall } = req.query;
    const halls = await BanquetHall.findAll({
        where: { manager_id: managerId },
        attributes: ['hall_id']
    });
    const hallIds = halls.map(h => h.hall_id);

    const where =
        hall !== 'all'
            ? { hall_id: hall }
            : { hall_id: { [Op.in]: hallIds } };


    const ratings = await Rating.findAll({ where });

    const count = ratings.length;
    const avgRating = count ? (ratings.reduce((sum, r) => sum + r.score, 0) / count) : 0;



    const distribution = {};
    for (let i = 1; i <= 5; i++) {
        distribution[i] = 0;
    }
    ratings.forEach(r => distribution[r.score]++);

    const recent = ratings.filter(r =>
        new Date(r.created_at) >= new Date(Date.now() - 30 * 24 * 3600 * 1000)
    ).length;

    const trendRaw = await Rating.findAll({
        where,
        attributes: [
            [Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"), "month"],
            [Sequelize.fn("AVG", Sequelize.col("score")), "avg"]
        ],
        group: ["month"],
        order: [["month", "ASC"]],
    });

    const trend = trendRaw.map(t => ({
        month: t.get("month"),
        avg: parseFloat(t.get("avg")),
    }));

    res.json({ count, avgRating, distribution, recent, trend });
};


export const getManagerBookings = async (req, res) => {
    try {

        const managerId = req.user.user_id;
        const { hallId, date } = req.query;
        if (!hallId || !date) {
            return res.status(400).json({
                message: 'hallId и date обязательны'
            });
        }

        const hall = await BanquetHall.findOne({
            where: { hall_id: hallId, manager_id: managerId }
        });
        if (!hall) {
            return res.status(403).json({ message: 'Зал не найден или недоступен' });
        }

        const bookings = await Booking.findAll({
            where: {
                hall_id: hallId,
                date: date
            },
            include: [
                {
                    model: Client,
                    attributes: ['client_id', 'phone'],
                    include: [
                        {
                            model: User,
                            attributes: ['first_name', 'last_name']
                        }
                    ]
                },
                {
                    model: EventType,
                    attributes: ['type_name']
                },
                {
                    model: BanquetHall,
                    attributes: ['hall_id', 'hall_name']
                }
            ],
            order: [['start_time', 'ASC']]
        });

        const result = bookings.map(b => ({
            booking_id: b.booking_id,
            start_time: b.start_time,
            end_time: b.end_time,
            guest_count: b.guest_count,
            status: b.status,
            payment_status: b.payment_status,
            payment_amount: b.payment_amount,
            client: {
                first_name: b.client?.user?.first_name || '',
                last_name: b.client?.user?.last_name || '',
                phone: b.client?.phone || ''
            },
            event_type: {
                name: b.event_type?.type_name || null
            },
            hall: {
                hall_id: b.banquetHall?.hall_id || '-',
                hall_name: b.banquetHall?.hall_name || '-'
            }

        }));

        res.json({
            bookings: result
        })

    } catch (err) {
        console.error('Ошибка при получении бронирований:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

export const getManagerShedulePage = async (req, res) => {
    try {
        const managerId = req.user.user_id;

        const halls = await BanquetHall.findAll({
            where: {
                manager_id: managerId
            },
            attributes: ['hall_id', 'hall_name']
        });

        res.render('p_manager/shedule', {
            halls,
            currentDate: new Date().toISOString().slice(0, 10)
        });
    } catch (err) {
        console.error('Ошибка при загрузке страницы расписания:', err);
        res.status(500).send('Ошибка сервера при загрузке расписания');
    }
};

export const getRegisterHallPage = async (req, res) => {
    try {

        const managerId = req.user.user_id;
        const manager = await User.findByPk(managerId);
        const managerName = `${manager.first_name} ${manager.last_name}`;
        res.render('p_manager/register-hall', { managerName });

    } catch (err) {
        console.error('Ошибка при загрузке страницы регистрации зала:', err);
        res.status(500).send('Ошибка сервера');
    }
}

export const postRegisterHall = async (req, res) => {
    try {
        const { hall_name, description, capacity, price, address, image_path } = req.body;
        const manager_id = req.user.user_id;

        if (!hall_name || !capacity || !price || !address) {
            return res.status(400).send('Пожалуйста, заполните все обязательные поля.');
        }

        await BanquetHall.create({
            hall_name,
            description,
            capacity,
            price,
            address,
            manager_id,
            image_path,
            status: 'pending'
        });

        res.json({
            success: true,
            title: 'Успех!',
            message: 'Банкетный зал успешно зарегистрирован.'
        });
    } catch (err) {
        console.error('Ошибка при регистрации зала:', err);
        res.status(500).json({
            success: false,
            title: 'Ошибка сервера',
            message: 'Не удалось зарегистрировать зал. Попробуйте позже.'
        });
    }
};

export const getReportPage = async (req, res) => {
    const managerId = req.user.user_id;
    const manager = await User.findByPk(managerId);
    const lastReport = await Report.findOne({
        order: [['report_id', 'DESC']]
    });
    const nextId = (lastReport?.report_id || 0) + 1;
    const currentDate = new Date().toLocaleDateString('ru-RU');

    res.render('p_manager/report', {
        reportId: nextId,
        managerName: `${manager.last_name} ${manager.first_name[0]}.`,
        currentDate,
    });
};

export const getReportData = async (req, res) => {
    try {
        const { start, end } = req.query;
        const managerId = req.user.user_id;

        const halls = await BanquetHall.findAll({
            where: { manager_id: managerId },
            attributes: ["hall_id", "hall_name"],
        });
        const hallIds = halls.map((h) => h.hall_id);

        if (!hallIds.length) return res.json([]);

        const data = await Booking.findAll({
            where: {
                hall_id: { [Op.in]: hallIds },
                date: { [Op.between]: [start, end] },
            },
            attributes: [
                [col("booking.hall_id"), "hall_id"],
                [fn("COUNT", col("booking.booking_id")), "bookings_count"],
                [literal("SUM(CASE WHEN `booking`.`status` = 'confirmed' THEN 1 ELSE 0 END)"), "completed_count"],
                [literal("SUM(CASE WHEN `booking`.`status` = 'cancelled' THEN 1 ELSE 0 END)"), "cancelled_count"],
                [fn("SUM", col("booking.payment_amount")), "revenue_sum"],
            ],
            group: ["booking.hall_id"],
            include: [{ model: BanquetHall, attributes: ["hall_name"] }],
        });

        const result = data.map((d) => ({
            hall_name: d.banquetHall?.hall_name || "—",
            bookings_count: Number(d.get("bookings_count")),
            completed_count: Number(d.get("completed_count")),
            cancelled_count: Number(d.get("cancelled_count")),
            revenue_sum: Number(d.get("revenue_sum")).toFixed(2),
        }));

        res.json(result);
    } catch (err) {
        console.error("Ошибка в getReportData:", err);
        res.status(500).json({ error: "Ошибка при получении данных отчёта" });
    }
};

export const saveReport = async (req, res) => {
    try {
        const { start, end } = req.body;
        const managerId = req.user.user_id;

        const halls = await BanquetHall.findAll({
            where: { manager_id: managerId },
            attributes: ["hall_id", "hall_name"],
        });

        const hallIds = halls.map((h) => h.hall_id);

        if (hallIds.length === 0) {
            return res.status(400).json({ message: "Нет залов для менеджера" });
        }

        const data = await Booking.findAll({
            where: {
                hall_id: { [Op.in]: hallIds },
                date: { [Op.between]: [start, end] },
            },
            attributes: [
                [col("booking.hall_id"), "hall_id"],
                [fn("COUNT", col("booking.booking_id")), "bookings_count"],
                [literal("SUM(CASE WHEN `booking`.`status` = 'confirmed' THEN 1 ELSE 0 END)"), "completed_count"],
                [fn("SUM", col("booking.payment_amount")), "revenue_sum"],
            ],
            group: ["booking.hall_id"],
            include: [{ model: BanquetHall, attributes: ["hall_name"] }],
        });

        const reportData = data.map((d) => {
            const hallObj = d.banquetHall || d.BanquetHall || (d.get ? d.get("banquetHall") : null);
            return {
                hall_name: hallObj?.hall_name || "—",
                bookings_count: Number(d.get ? d.get("bookings_count") : d.dataValues.bookings_count || 0),
                completed_count: Number(d.get ? d.get("completed_count") : d.dataValues.completed_count || 0),
                revenue_sum: Number(d.get ? d.get("revenue_sum") : d.dataValues.revenue_sum || 0).toFixed(2),
            };
        });

        await Report.create({
            manager_id: managerId,
            period_start: start,
            period_end: end,
            report_data: JSON.stringify(reportData),
        });

        res.json({ message: "Отчет успешно сохранён" });
    } catch (error) {
        console.error("Ошибка при сохранении отчёта:", error);
        res.status(500).json({ message: "Ошибка при сохранении отчёта" });
    }
}

export const exportReportExcel = async (req, res) => {
    try {
        const { start, end } = req.query;
        const managerId = req.user.user_id;

       
        const manager = await User.findByPk(managerId, {
            attributes: ["first_name", "last_name"],
        });

        const halls = await BanquetHall.findAll({
            where: { manager_id: managerId },
            attributes: ["hall_id", "hall_name"],
        });
        const hallIds = halls.map((h) => h.hall_id);

        const data = await Booking.findAll({
            where: {
                hall_id: { [Op.in]: hallIds },
                date: { [Op.between]: [start, end] },
            },
            attributes: [
                [col("booking.hall_id"), "hall_id"],
                [fn("COUNT", col("booking.booking_id")), "bookings_count"],
                [
                    literal("SUM(CASE WHEN `booking`.`status` = 'confirmed' THEN 1 ELSE 0 END)"),
                    "completed_count",
                ],
                [
                    literal("SUM(CASE WHEN `booking`.`status` = 'cancelled' THEN 1 ELSE 0 END)"),
                    "cancelled_count",
                ],
                [fn("SUM", col("booking.payment_amount")), "revenue_sum"],
            ],
            group: ["booking.hall_id"],
            include: [{ model: BanquetHall, attributes: ["hall_name"] }],
        });

 
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Отчёт по залам");

        sheet.addRow([]);
        const orgRow = sheet.addRow(["ООО «BanquetBook»"]);
        sheet.mergeCells(`A${orgRow.number}:F${orgRow.number}`);
        orgRow.font = { bold: true, size: 16 };
        orgRow.alignment = { horizontal: "center" };

        const periodRow = sheet.addRow([`Отчёт по залам за период ${start} — ${end}`]);
        sheet.mergeCells(`A${periodRow.number}:F${periodRow.number}`);
        periodRow.font = { bold: true, size: 13 };
        periodRow.alignment = { horizontal: "center" };

        sheet.addRow([]); 

        sheet.columns = [
            { header: "Зал", key: "hall_name", width: 25 },
            { header: "Кол-во бронирований", key: "bookings_count", width: 20 },
            { header: "Проведено мероприятий", key: "completed_count", width: 20 },
            { header: "Отменено", key: "cancelled_count", width: 15 },
            { header: "Процент отмен (%)", key: "cancelled_percent", width: 20 },
            { header: "Выручка (BYN)", key: "revenue_sum", width: 15 },
        ];

        sheet.addRow({}); 
        sheet.getRow(sheet.lastRow.number).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });

        let totalRevenue = 0;
        let totalBookings = 0;
        let totalCompleted = 0;
        let totalCancelled = 0;

        data.forEach((d) => {
            const bookings = Number(d.get("bookings_count"));
            const cancelled = Number(d.get("cancelled_count"));
            const completed = Number(d.get("completed_count"));
            const revenue = Number(d.get("revenue_sum")) || 0;
            const percentCancelled = bookings ? ((cancelled / bookings) * 100).toFixed(1) : 0;

            const row = sheet.addRow({
                hall_name: d.banquetHall?.hall_name || "—",
                bookings_count: bookings,
                completed_count: completed,
                cancelled_count: cancelled,
                cancelled_percent: percentCancelled,
                revenue_sum: revenue.toFixed(2),
            });

            row.alignment = { horizontal: "center" };

            totalRevenue += revenue;
            totalBookings += bookings;
            totalCompleted += completed;
            totalCancelled += cancelled;
        });

        sheet.addRow([]);
        const totalRow = sheet.addRow({
            hall_name: "ИТОГО:",
            bookings_count: totalBookings,
            completed_count: totalCompleted,
            cancelled_count: totalCancelled,
            cancelled_percent: totalBookings ? ((totalCancelled / totalBookings) * 100).toFixed(1) : 0,
            revenue_sum: totalRevenue.toFixed(2),
        });
        totalRow.font = { bold: true };
        totalRow.alignment = { horizontal: "center" };

        sheet.addRow([]);
        const footerRow = sheet.addRow([
            `Дата составления: ${new Date().toLocaleDateString("ru-RU")}`,
            "",
            `Менеджер: ${manager.last_name} ${manager.first_name}`,
            "",
            "Подпись: ___________________",
        ]);
        footerRow.font = { italic: true };
        footerRow.eachCell((cell) => {
            cell.alignment = { horizontal: "center" };
        });


        res.setHeader(
            "Content-Disposition",
            `attachment; filename=report_${start}_${end}.xlsx`
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error("Ошибка при экспорте отчёта:", err);
        res.status(500).json({ message: "Ошибка при экспорте отчёта" });
    }
};


export const getWaitingListPage = async (req, res) => {
    // try {
    //     const halls = await BanquetHall.findAll({
    //         where: { manager_id: req.user.user_id }
    //     });

    //     // Загружаем все активные записи в листе ожидания (для предпросмотра)
    //     const waitingList = await WaitingList.findAll({
    //         include: [
    //             { model: Client },
    //             { model: BanquetHall, attributes: ["hall_name"] }
    //         ],
    //         where: {},
    //         order: [
    //             ["desired_date", "ASC"],
    //             ["start_time", "ASC"]
    //         ]
    //     });

    //     res.render("p_manager/waitingList", { halls, waitingList });
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send("Ошибка загрузки страницы");
    // }
    try {
        const halls = await BanquetHall.findAll({
            where: { manager_id: req.user.user_id }
        });

       
        res.render("p_manager/waitingList", { halls, waitingList: [] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Ошибка загрузки страницы");
    }
};

export const getScheduleData = async (req, res) => {
    try {
        const { hall_id, date } = req.query;
        if (!hall_id || !date) return res.status(400).json({ message: "Нужны hall_id и date" });

        const bookings = await Booking.findAll({
            where: { hall_id, date },
            include: [
                {
                    model: Client,
                    include: [{ model: User, attributes: ["first_name", "last_name"] }]
                }
            ],
            order: [["start_time", "ASC"]],
        });

        res.json({
            bookings: bookings.map(b => ({
                booking_id: b.booking_id,
                start_time: b.start_time,
                end_time: b.end_time,
                status: b.status,
                date:date,
                client_name: b.client && b.client.user
                    ? `${b.client.user.first_name} ${b.client.user.last_name}`
                    : "Без имени"
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Ошибка загрузки расписания" });
    }
};

export const getWaitingListForHall = async (req, res) => {
    try {
        const { hall_id } = req.query;
        if (!hall_id) return res.status(400).json({ message: "Нужен hall_id" });

        const waiting = await WaitingList.findAll({
            where: { hall_id },
            include: [
                {
                    model: Client,
                    include: [{ model: User, attributes: ["first_name", "last_name"] }]
                }
            ],
            order: [
                ["desired_date", "ASC"],
                ["start_time", "ASC"],
                ["queue_position", "ASC"]
            ]
        });

        res.json({
            waiting: waiting.map(w => ({
                waiting_id: w.waiting_id,
                client_id: w.client_id,
                desired_date: w.desired_date,
                start_time: w.start_time,
                end_time: w.end_time,
                queue_position: w.queue_position,
                client_name: w.client && w.client.user
                    ? `${w.client.user.first_name} ${w.client.user.last_name}`
                    : "Без имени",
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Ошибка загрузки листа ожидания" });
    }
};

export const assignFromWaiting = async (req, res) => {
    // try {
    //     const waiting = await WaitingList.findByPk(req.params.id);
    //     if (!waiting) return res.status(404).json({ message: "Запись не найдена" });

    //     // Создаём новую бронь
    //     await Booking.create({
    //         client_id: waiting.client_id,
    //         hall_id: waiting.hall_id,
    //         date: waiting.desired_date,
    //         start_time: waiting.start_time,
    //         end_time: waiting.end_time || "23:00:00", // если нет — ставим конец дня
    //         status: "pending",
    //         payment_status: "unpaid",
    //         guest_count: 0,
    //     });

    //     const { hall_id, desired_date, queue_position } = waiting;

    //     // Удаляем выбранную запись
    //     await waiting.destroy();

    //     // Сдвигаем позиции оставшихся записей вверх
    //     await WaitingList.increment(
    //         { queue_position: -1 },
    //         {
    //             where: {
    //                 hall_id,
    //                 desired_date,
    //                 queue_position: { [Op.gt]: queue_position },
    //             },
    //         }
    //     );

    //     res.json({ message: "Клиент назначен на освободившееся время" });
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).json({ message: "Ошибка назначения" });
    // }
    try {
        const waitingId = req.params.id;
        const { targetBookingId } = req.body || {};

        const waiting = await WaitingList.findByPk(waitingId);
        if (!waiting) return res.status(404).json({ message: "Запись листа ожидания не найдена" });

        const hall_id = waiting.hall_id;
        const date = waiting.desired_date;
        const start = waiting.start_time;
        const end = waiting.end_time;

        const overlapWhere = {
            hall_id,
            date,
            [Op.and]: [
                {
                    start_time: { [Op.lt]: end }
                },
                {
                    end_time: { [Op.gt]: start }
                }
            ]
        };
        if (targetBookingId) {
            overlapWhere.booking_id = { [Op.ne]: targetBookingId };
        }

        const conflicting = await Booking.findOne({
            where: overlapWhere
        });

        if (conflicting) {
            return res.status(409).json({ message: "Время пересекается с существующей бронью" });
        }

        if (targetBookingId) {
            const target = await Booking.findByPk(targetBookingId);
            if (!target) return res.status(404).json({ message: "Целевая бронь не найдена" });

            await target.update({
                client_id: waiting.client_id,
                date,
                start_time: start,
                end_time: end,
                status: "pending",
                payment_status: "unpaid"
            });

            const { queue_position } = waiting;
            await waiting.destroy();

            await WaitingList.increment(
                { queue_position: -1 },
                {
                    where: {
                        hall_id,
                        desired_date: date,
                        queue_position: { [Op.gt]: queue_position }
                    }
                }
            );

            return res.json({ message: "Назначено: целевая бронь обновлена" });
        }

        await Booking.create({
            client_id: waiting.client_id,
            hall_id,
            date,
            start_time: start,
            end_time: end,
            status: "pending",
            payment_status: "unpaid",
            from_waiting_list:true,
            guest_count: 0
        });

        const { queue_position } = waiting;
        await waiting.destroy();
        await WaitingList.increment(
            { queue_position: -1 },
            {
                where: {
                    hall_id,
                    desired_date: date,
                    queue_position: { [Op.gt]: queue_position }
                }
            }
        );

        return res.json({ message: "Клиент назначен и запись из листа удалена" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Ошибка назначения из листа ожидания" });
    }
};


export const getAvailableWaitingForBooking = async (req, res) => {
  try {
    const { hall_id, date } = req.query;
    if (!hall_id || !date)
      return res.status(400).json({ message: "Нужны hall_id и date" });

    const bookings = await Booking.findAll({
      where: { hall_id, date },
      attributes: ["start_time", "end_time"],
    });

    const waitingList = await WaitingList.findAll({
      where: { hall_id, desired_date: date },
      include: [
        {
          model: Client,
          include: [{ model: User, attributes: ["first_name", "last_name"] }],
        },
      ],
      order: [["queue_position", "ASC"]],
    });

    const available = waitingList.filter((w) => {
      const wStart = w.start_time;
      const wEnd = w.end_time;
      const hasConflict = bookings.some(
        (b) => wStart < b.end_time && wEnd > b.start_time
      );
      return !hasConflict;
    });

    res.json({
      waiting: available.map((w) => ({
        waiting_id: w.waiting_id,
        desired_date: w.desired_date,
        start_time: w.start_time,
        end_time: w.end_time,
        queue_position: w.queue_position,
        client_name:
          w.Client && w.Client.User
            ? `${w.Client.User.first_name} ${w.Client.User.last_name}`
            : "Без имени",
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка загрузки доступных заявок" });
  }
};







