document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("reportsTableBody");

    try {
        const res = await fetch("/admin/reports/list");
        const data = await res.json();

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="5">Отчётов пока нет</td></tr>`;
            return;
        }

        data.forEach((r,index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
        <td>${index+1}</td>
        <td>${r.manager_name}</td>
        <td>${r.period_start} — ${r.period_end}</td>
        <td>${new Date(r.report_date).toLocaleString("ru-RU")}</td>
        <td>
          <a href="/admin/reports/view/${r.report_id}" class="btn-view">Просмотр</a>

        </td>
      `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Ошибка загрузки отчётов:", err);
        tbody.innerHTML = `<tr><td colspan="5">Ошибка при загрузке</td></tr>`;
    }
});
