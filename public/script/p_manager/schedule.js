document.addEventListener('DOMContentLoaded', () => {
  const hallSelect = document.getElementById('hallSelect');
  const dateInput = document.getElementById('dateInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const timeline = document.getElementById('timeline');

  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const closeModal = document.getElementById('closeModal');

  async function loadBookings() {
    const hallId = hallSelect?.value;
    const date = dateInput?.value;

    if (!hallId || !date) {
      timeline.innerHTML = '<div class="empty">Выберите зал и дату, чтобы увидеть мероприятия</div>';
      return;
    }

    timeline.innerHTML = '<div class="empty">Загружаю...</div>';

    try {
      const res = await fetch(`/manager/bookings?hallId=${hallId}&date=${date}`);
      if (!res.ok) throw new Error('Ошибка получения данных расписания');

      const data = await res.json();
      renderTimeline(data.bookings);
    } catch (err) {
      console.error(err);
      timeline.innerHTML = '<div class="empty">Ошибка при загрузке. Попробуйте обновить страницу.</div>';
    }
  }

  function renderTimeline(bookings) {
    if (!bookings || bookings.length === 0) {
      timeline.innerHTML = '<div class="empty">На выбранную дату нет мероприятий.</div>';
      return;
    }

    const nodes = bookings.map(b => {
      const statusClass = b.status || 'pending';
      const timeRange = `${b.start_time.slice(0, 5)} — ${b.end_time.slice(0, 5)}`;
      const eventType = b.event_type?.name || '-';
      const clientName = b.client.first_name || '-';
      const clientLast = b.client.last_name || '';
      const clientPhone = b.client.phone || '—';

      const outer = document.createElement('div');
      outer.className = `time-slot ${statusClass}`;
      outer.innerHTML = `
        <div class="left">
          <div>${timeRange}</div>
          <div class="event-type">${eventType} • ${b.guest_count} гостей</div>
        </div>
        <div class="right">
          <div class="client-info">${clientName} ${clientLast}</div>
          <div class="client-info">${clientPhone}</div>
          <button class="btn-small" data-id="${b.booking_id}">Подробнее</button>
        </div>
      `;
      outer.querySelector('button')?.addEventListener('click', () => openModal(b));
      return outer;
    });

    timeline.innerHTML = '';
    nodes.forEach(n => timeline.appendChild(n));
  }

  function openModal(b) {
    modalBody.innerHTML = `
      <p><strong>Время:</strong> ${b.start_time.slice(0, 5)} — ${b.end_time.slice(0, 5)}</p>
      <p><strong>Клиент:</strong> ${b.client.first_name || ''} ${b.client.last_name || ''}</p>
      <p><strong>Телефон:</strong> ${b.client.phone || '—'}</p>
      <p><strong>Тип мероприятия:</strong> ${b.event_type?.name || '—'}</p>
      <p><strong>Гостей:</strong> ${b.guest_count}</p>
      <p><strong>Статус:</strong> ${b.status}</p>
      <p><strong>Оплата:</strong> ${b.payment_status} (${b.payment_amount || 0})</p>
    `;
    modal.style.display = 'flex';
  }

  closeModal.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  refreshBtn?.addEventListener('click', loadBookings);
  hallSelect?.addEventListener('change', loadBookings);
  dateInput?.addEventListener('change', loadBookings);

  // при загрузке страницы сразу пробуем загрузить
  loadBookings();
});
