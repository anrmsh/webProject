document.addEventListener('DOMContentLoaded', () => {
    const endInput = document.getElementById('endDate');
    const startInput = document.getElementById('startDate');

    const today = new Date();
    const priorDate = new Date();
    priorDate.setDate(today.getDate() - 30);

    const formateDate = (date) => date.toISOString().split('T')[0];

    endInput.value = formateDate(today);
    startInput.value = formateDate(priorDate);

    document.getElementById('loadReport').click();
})


document.getElementById('loadReport').addEventListener('click', async () => {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (!start || !end) {
        alert('Выберите даты для формирования отчёта');
        return;
    }

    const res = await fetch(`/manager/report/data?start=${start}&end=${end}`);
    const data = await res.json();
    const tbody = document.getElementById('reportBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="4" class="empty">Нет данных за выбранный период</td></tr>';
        return;
    }

    let totalRevenue = 0;
    let totalBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    data.forEach((row) => {
        totalRevenue += parseFloat(row.revenue_sum);
        totalBookings += row.bookings_count;
        completedBookings += row.completed_count;
        cancelledBookings += row.cancelled_count || 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${row.hall_name}</td>
      <td>${row.bookings_count}</td>
      <td>${row.completed_count}</td>
      <td>${row.revenue_sum}</td>
    `;
        tbody.appendChild(tr);
    });

    const completedPercent = totalBookings
        ? ((completedBookings / totalBookings) * 100).toFixed(1)
        : 0;
    const cancelledPercent = totalBookings
        ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
        : 0;
    const avgCheck = totalBookings
        ? (totalRevenue / totalBookings).toFixed(2)
        : 0;


    document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2) + ' BYN';
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('completedPercent').textContent = completedPercent + '%';
    document.getElementById('cancelledPercent').textContent = cancelledPercent + '%';
    document.getElementById('avgCheck').textContent = avgCheck + ' BYN';
});


document.getElementById('submitReport').addEventListener('click', async () => {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById("endDate").value;

    const res = await fetch('/manager/report/save', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start, end }),
    });

    if (res.ok) {
        document.getElementById("modalOverlay").style.display = "flex";
    }

});

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("modalOverlay").style.display = "none";
});

document.getElementById('exportExcel').addEventListener('click', async () => {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (!start || !end) {
        alert('Выберите период для экспорта');
        return;
    }

    const res = await fetch(`/manager/report/export?start=${start}&end=${end}`);
    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${start}_${end}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
});
