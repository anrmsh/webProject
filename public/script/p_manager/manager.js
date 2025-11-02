document.addEventListener('DOMContentLoaded', () => {
    const hallSelected = document.getElementById('hallSelect');
    const bookingsCount = document.getElementById('bookingsCount');
    const guestsCount = document.getElementById('guestsCount');
    const averageRating = document.getElementById('averageRating');
    const revenueSum = document.getElementById('revenueSum');

    const statusChartCtx = document.getElementById('statusChart');
    const bookingsChartCtx = document.getElementById('hallBookingsChart');

    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    let statusChart, bookingsChart;

    async function loadHallStats(hallId) {
        const res = await fetch(`/manager/hall-stats/${hallId}`);
        const data = await res.json();

        // ===== обновляем карточки =====
        bookingsCount.textContent = data.bookingsCount;
        guestsCount.textContent = data.guestsCount;
        averageRating.textContent = data.averageRating;
        revenueSum.textContent = data.revenueSum + ' BYN';

        // ===== диаграмма статусов =====
        const statusData = [
            data.statusCounts.confirmed,
            data.statusCounts.pending,
            data.statusCounts.cancelled
        ];
        const totalBookings = statusData.reduce((total, b) => total + b, 0);
        const totalBookingsElem = document.getElementById('totalBookings');

        if(totalBookings) totalBookingsElem.textContent = totalBookings;
        if (statusChart) statusChart.destroy();

        statusChart = new Chart(statusChartCtx, { type: 'doughnut', data: { labels: ['Подтверждено', 'В ожидании', 'Отменено'], datasets: [{ data: statusData, backgroundColor: ['#4CAF50', '#FFC107', '#F44336'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
        // ===== диаграмма динамики =====
        const months = data.bookingsByMonth.map(m => monthNames[m.month-1]);
        const counts = data.bookingsByMonth.map(m => m.count);

        if (bookingsChart) bookingsChart.destroy();

        bookingsChart = new Chart(bookingsChartCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Количество бронирований',
                    data: counts,
                    backgroundColor: '#ae3962'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    hallSelected.addEventListener('change', (e) => {
        loadHallStats(e.target.value);
    });

    // загрузка при первой отрисовке
    if (hallSelected.value) {
        loadHallStats(hallSelected.value);
    } else {
        console.warn('Нет выбранного зала для загрузки графиков');
    }

});
