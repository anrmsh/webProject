document.addEventListener("DOMContentLoaded", () => {
  const hallSelect = document.getElementById("hallSelect");
  const dateInput = document.getElementById("dateInput");
  const refreshBtn = document.getElementById("refreshBtn");
  const timeline = document.getElementById("timeline");
  const waitingListDiv = document.getElementById("waitingList").querySelector(".list-content");

  // modal
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeModal = document.getElementById("closeModal");

  let currentHall = hallSelect.value;

  async function loadWaitingForHall(hallId) {
    if (!hallId) {
      waitingListDiv.innerHTML = `<div class="empty">Нет назначенных залов</div>`;
      return;
    }
    const res = await fetch(`/manager/api/waiting-list?hall_id=${hallId}`);
    if (!res.ok) {
      console.error("Ошибка при загрузке листа ожидания", res.status);
      waitingListDiv.innerHTML = `<div class="empty">Ошибка загрузки</div>`;
      return;
    }
    const data = await res.json();
    renderWaitingListAll(data.waiting);
  }

  async function loadSchedule(hallId, date) {
    if (!hallId || !date) return;
    const res = await fetch(`/manager/api/schedule?hall_id=${hallId}&date=${date}`);
    if (!res.ok) {
      console.error("Ошибка при загрузке расписания", res.status);
      timeline.innerHTML = `<div class="empty">Ошибка загрузки</div>`;
      return;
    }
    const data = await res.json();
    renderTimeline(data.bookings || []);
  }

  function renderTimeline(bookings) {
    timeline.innerHTML = "";
    if (!bookings || !bookings.length) {
      timeline.innerHTML = `<div class="empty">Нет бронирований на выбранную дату</div>`;
      return;
    }
    bookings.forEach(b => {
      const div = document.createElement("div");
      div.className = `time-slot ${b.status}`;
      const left = `<div class="left">${b.start_time}–${b.end_time}</div>`;
      const right = `
        <div class="right">
          <div class="client-info">${b.client_name || "Без имени"}</div>
          <small>${b.status}</small>
        </div>
      `;
      div.innerHTML = left + right;

      // если бронь отменена — показываем кнопку "Назначить из листа"
      if (b.status === "cancelled") {
        const btn = document.createElement("button");
        btn.className = "btn-small";
        btn.textContent = "Назначить из листа";
        btn.addEventListener("click", () => openAssignModal(b.booking_id, b));
        div.appendChild(btn);
      }
      timeline.appendChild(div);
    });
  }

  function renderWaitingListAll(list) {
    waitingListDiv.innerHTML = "";
    if (!list || !list.length) {
      waitingListDiv.innerHTML = `<div class="empty">Нет заявок в листе ожидания</div>`;
      return;
    }
    // отображаем: дата, время, имя и позиция
    list.forEach(item => {
      const div = document.createElement("div");
      div.className = "waiting-item";
      div.innerHTML = `
        <div class="wl-left"><strong>${item.client_name}</strong></div>
        <div class="wl-right">${item.desired_date} · ${item.start_time}–${item.end_time} <span class="pos">#${item.queue_position}</span></div>
      `;
      waitingListDiv.appendChild(div);
    });
  }

  // открывает модал и показывает заявки, подходящие по залу и (опционально) по дате брони
  async function openAssignModal(targetBookingId, booking) {
    modalTitle.textContent = "Выбрать заявку из листа ожидания";
    modalBody.innerHTML = `<div class="loading">Загрузка...</div>`;
    modal.style.display = "block";

    const res = await fetch(
      `/manager/api/waiting-list/available?hall_id=${currentHall}&date=${booking.date}`
    );
    if (!res.ok) {
      modalBody.innerHTML = `<div class="empty">Ошибка загрузки</div>`;
      return;
    }

    const data = await res.json();
    const list = data.waiting || [];

    if (!list.length) {
      modalBody.innerHTML = `<div class="empty">Нет доступных заявок без пересечений</div>`;
      return;
    }

    modalBody.innerHTML = "";
    list.forEach((w) => {
      const row = document.createElement("div");
      row.className = "modal-waiting-row";
      row.innerHTML = `
      <strong>${w.client_name}</strong> — ${w.start_time}–${w.end_time}
      <span class="pos">#${w.queue_position}</span>
    `;
      const chooseBtn = document.createElement("button");
      chooseBtn.className = "btn-small";
      chooseBtn.textContent = "Назначить";
      chooseBtn.addEventListener("click", () =>
        confirmAssign(w.waiting_id, targetBookingId)
      );
      row.appendChild(chooseBtn);
      modalBody.appendChild(row);
    });
  }


  // отправляем запрос на назначение (targetBookingId передаём в теле)
  async function confirmAssign(waitingId, targetBookingId) {
    try {
      const res = await fetch(`/manager/api/assign-waiting/${waitingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetBookingId })
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message || "Ошибка назначения");
      } else {
        alert(json.message);
      }
      closeModal.click();
      // обновляем данные
      await loadWaitingForHall(currentHall);
      await loadSchedule(currentHall, dateInput.value);
    } catch (err) {
      console.error(err);
      alert("Серверная ошибка");
    }
  }

  closeModal.addEventListener("click", () => { modal.style.display = "none"; modalBody.innerHTML = ""; });

  // события
  hallSelect.addEventListener("change", async () => {
    currentHall = hallSelect.value;
    await loadWaitingForHall(currentHall);
    await loadSchedule(currentHall, dateInput.value);
  });
  refreshBtn.addEventListener("click", () => loadSchedule(currentHall, dateInput.value));
  dateInput.addEventListener("change", () => loadSchedule(currentHall, dateInput.value));

  // init
  currentHall = hallSelect.value;
  loadWaitingForHall(currentHall);
  loadSchedule(currentHall, dateInput.value);
});
