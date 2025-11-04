document.addEventListener('DOMContentLoaded', async () => {
    const hallSelect = document.getElementById('hallSelect');
    hallSelect?.addEventListener('change', loadData);
    await loadData();
});

async function loadData() {
    const hallId = document.getElementById('hallSelect')?.value || 'all';
    const res = await fetch(`/manager/ratings/data?hall=${hallId}`);
    const data = await res.json();

    document.getElementById("avgRating").textContent = data.avgRating?.toFixed(2) || "-";
    document.getElementById("ratingsCount").textContent = data.count || "0";
    document.getElementById("recentCount").textContent = data.recent || "0";

    renderCharts(data.distribution, data.trend);
}

function renderCharts(distribution, trend) {
    const distCtx = document.getElementById('distributionChart');
    const trendCtx = document.getElementById("trendChart");


    if (!distCtx || !trendCtx) return;


    if (window.distChart instanceof Chart) {
        window.distChart.destroy();
    }
    if (window.trendChart instanceof Chart) {
        window.trendChart.destroy();
    }


    window.distChart = new Chart(distCtx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5'],
            datasets: [
                {
                    label: 'Количество оценок',
                    data: [1, 2, 3, 4, 5].map(k => distribution[k] || 0),
                    borderWidth: 1,
                    backgroundColor: '#ae3962'
                }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Динамика среднего рейтинга
    window.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trend.map(t => t.month),
            datasets: [
                {
                    label: 'Средний рейтинг',
                    data: trend.map(t => t.avg),
                    borderWidth: 2,
                    borderColor: '#ae3962',
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 5 } } }
    });
}