async function fetchDashboardData(){
    const res = await fetch('/admin/dashboard-data');
    const data = await res.json();
    return data;
}

function renderCharts(data){
    new Chart(document.getElementById('monthlyBookingsChart'), {
        type: 'line',
        data: {
            labels: data.months,
            datasets: [{
                label: 'Бронирования',
                data: data.bookingsPerMonth,
                backgroundColor: 'rgba(174,57,98,0.2)',
                borderColor: 'rgba(174,57,98,1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {responsive: true}
    });
    // Статусы бронирований
    new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: ['Подтверждено', 'В ожидании', 'Отменено'],
            datasets: [{
                data: [data.statusCounts.confirmed, data.statusCounts.pending, data.statusCounts.cancelled],
                backgroundColor: ['green', 'orange', 'red']
            }]
        },
        options: { responsive:true }
    });

    // Топ-5 залов
    new Chart(document.getElementById('topHallsChart'), {
        type: 'bar',
        data: {
            labels: data.topHalls.map(h=>h.hall_name),
            datasets: [{
                label: 'Количество бронирований',
                data: data.topHalls.map(h=>h.count),
                backgroundColor: 'rgba(174,57,98,0.7)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive:true
        }
    });

    // Гости по месяцам
    new Chart(document.getElementById('guestsChart'), {
        type: 'bar',
        data: {
            labels: data.months,
            datasets: [{
                label: 'Гостей',
                data: data.guestsPerMonth,
                backgroundColor: 'rgba(54,162,235,0.7)'
            }]
        },
        options: { responsive:true }
    });
}

async function initDashboard() {
    const data = await fetchDashboardData();
    renderCharts(data);
}

initDashboard();

// Экспорт в Word
document.getElementById('exportBtn').addEventListener('click', () => {
    fetch('/admin/export-dashboard')
        .then(res => res.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dashboard.docx';
            a.click();
            window.URL.revokeObjectURL(url);
        });
});