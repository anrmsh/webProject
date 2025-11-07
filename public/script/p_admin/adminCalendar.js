let current = new Date();
const calendarBody = document.getElementById('calendarBody');
const currentMonth = document.getElementById('currentMonth');
const modal = document.getElementById('bookingModal');
const modalClose = document.getElementById('modalClose');
const modalDate = document.getElementById('modalDate');
const modalBookings = document.getElementById('modalBookings');

async function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    currentMonth.textContent = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

    const res = await fetch(`/admin/calendar/${year}/${month}`);
    const data = await res.json();
    const monthCalendar = data.calendar || {};

    const firstDay = new Date(year, month - 1, 1);
    const startDay = (firstDay.getDay() + 6) % 7; // Пн=0
    const lastDay = new Date(year, month, 0).getDate();

    let html = '';
    let dayCounter = 1;
    for (let week = 0; week < 6; week++) {
        html += '<tr>';
        for (let d = 0; d < 7; d++) {
            if ((week === 0 && d < startDay) || dayCounter > lastDay) {
                html += '<td></td>';
            } else {
                const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
                const bookings = monthCalendar[dayStr] || [];
                const hasBooking = bookings.length > 0;
                html += `<td data-date="${dayStr}">
                    <span class="date-circle ${hasBooking ? 'has-booking' : ''}">${dayCounter}</span>
                </td>`;
                dayCounter++;
            }
        }
        html += '</tr>';
        if (dayCounter > lastDay) break;
    }
    calendarBody.innerHTML = html;

    document.querySelectorAll('#calendarBody td[data-date]').forEach(td => {
      
        const statusText = {
            confirmed: 'Подтверждено',
            pending: 'В ожидании',
            cancelled: 'Отменено',
            waiting_list: 'Лист ожидания'
        };
        td.addEventListener('click', () => {
            const day = td.getAttribute('data-date');
            const bookings = monthCalendar[day] || [];
            bookings.sort((a, b) => a.start_time.localeCompare(b.start_time));
            modalDate.textContent = `Бронирования на ${day}`;
            modalBookings.innerHTML = bookings.length ? bookings.map(b => `
                <div class="booking-item">
                    <strong>${b.hall_name}</strong><br>
                    ${b.start_time} - ${b.end_time}, Гостей: ${b.guest_count}, 
                    <span class="booking-status ${b.status}">${statusText[b.status] || b.status}</span>
                </div>
            `).join('') : '<p>Нет бронирований</p>';
            modal.style.display = 'flex';
        });
    });
}

modalClose.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

document.getElementById('prevMonth').addEventListener('click', () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar(current);
});

document.getElementById('nextMonth').addEventListener('click', () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar(current);
});

renderCalendar(current);