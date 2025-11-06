(function () {
  // ====== Данные из EJS ======
  const { hall, disabledDates } = window.__INITIAL_DATA__ || {};
  const basePrice = parseFloat(hall?.price ?? 0);

  const modal = document.getElementById('bookingModal');
  const openBtn = document.getElementById('bookBtn');
  const form = document.getElementById('bookingForm');
  const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
  const totalPriceEl = document.getElementById('totalPrice');
  const dateInput = document.getElementById('datePicker');
  const startInput = document.getElementById('startTime');
  const endInput = document.getElementById('endTime');
  const waitListBtn = document.getElementById('waitListBtn');
  const bookNowBtn = document.getElementById('bookNowBtn');
  const eventType = document.getElementById('eventType');
  const otherEventBlock = document.getElementById('otherEventBlock');
  const bookedSlotsContainer = document.getElementById('bookedSlotsContainer');
  const bookedSlotsList = document.getElementById('bookedSlotsList');
  const formMessage = document.getElementById('formMessage');

  let currentDateSlots = [];


  // ===== Flatpickr с учётом локального времени =====
  flatpickr(dateInput, {
    dateFormat: "Y-m-d",
    locale: flatpickr.l10ns.ru,
    disable: [],
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      const y = dayElem.dateObj.getFullYear();
      const m = String(dayElem.dateObj.getMonth() + 1).padStart(2,'0');
      const d = String(dayElem.dateObj.getDate()).padStart(2,'0');
      const str = `${y}-${m}-${d}`;
      if (disabledDates.includes(str)) {
        dayElem.classList.add('partially-booked');
      }
    },
    onChange: async (selectedDates, dateStr) => {
      await loadSlots(dateStr);
    }
  });

  // ====== Пересчёт стоимости ======
  function recalcTotal() {
    let total = basePrice;
    serviceCheckboxes.forEach(cb => {
      if (cb.checked) total += parseFloat(cb.dataset.price || 0);
    });
    if (totalPriceEl) totalPriceEl.textContent = total.toFixed(2);
  }
  serviceCheckboxes.forEach(cb => cb.addEventListener('change', recalcTotal));
  recalcTotal();

  // ====== Время ======
  function timeToMinutes(t) {
    if (!t) return null;
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    const A1 = timeToMinutes(aStart), A2 = timeToMinutes(aEnd);
    const B1 = timeToMinutes(bStart), B2 = timeToMinutes(bEnd);
    if (A1 === null || A2 === null || B1 === null || B2 === null) return false;
    return Math.max(A1, B1) < Math.min(A2, B2);
  }

  // ====== Загрузка слотов ======
  async function fetchSlotsForDate(date) {
    if (!date) return { slots: [], fullDayBooked: false };
    try {
      const url = `/bookings/slots?hall_id=${encodeURIComponent(hall.hall_id)}&date=${encodeURIComponent(date)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Ошибка загрузки слотов');
      return await res.json();
    } catch (e) {
      console.error(e);
      return { slots: [], fullDayBooked: false };
    }
  }

  function renderBookedSlots(slots) {
    bookedSlotsList.innerHTML = '';
    if (!slots?.length) {
      bookedSlotsContainer.style.display = 'none';
      return;
    }
    bookedSlotsContainer.style.display = 'block';
    slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    slots.forEach(s => {
      const li = document.createElement('li');
      li.className = 'booked-slots-item';
      li.textContent = `${s.start_time} — ${s.end_time}`;
      bookedSlotsList.appendChild(li);
    });
  }

  function isSelectedSlotConflict(date, start, end) {
    if (!date || !start || !end) return false;
    return currentDateSlots.some(s => rangesOverlap(start, end, s.start_time, s.end_time));
  }

  function enableSubmit(yes) {
    if (yes) {
      bookNowBtn.removeAttribute('disabled');
      bookNowBtn.classList.remove('disabled');
    } else {
      bookNowBtn.setAttribute('disabled', 'true');
      bookNowBtn.classList.add('disabled');
    }
  }

  async function onDateChange() {
    const date = dateInput.value;
    if (!date) return;
    const { slots, fullDayBooked } = await fetchSlotsForDate(date);
    currentDateSlots = slots;
    renderBookedSlots(slots);

    if (fullDayBooked) {
      formMessage.textContent = "Этот день полностью забронирован. Можно добавить в лист ожидания.";
      enableSubmit(false);
      waitListBtn.style.display = "inline-block";
    } else {
      formMessage.textContent = "";
      enableSubmit(true);
      waitListBtn.style.display = "none";
    }
  }

  dateInput.addEventListener('change', onDateChange);

  function updateFormState() {
    const date = dateInput.value;
    const start = startInput.value;
    const end = endInput.value;

    formMessage.textContent = '';
    waitListBtn.style.display = 'none';

    if (!date || !start || !end) {
      enableSubmit(false);
      return;
    }

    if (timeToMinutes(end) <= timeToMinutes(start)) {
      formMessage.textContent = 'Время окончания не может быть раньше времени начала.';
      enableSubmit(false);
      return;
    }

    const conflict = isSelectedSlotConflict(date, start, end);
    if (conflict) {
      formMessage.textContent = 'Выбранное время пересекается с другим бронированием. Вы можете добавить заявку в лист ожидания.';
      enableSubmit(false);
      waitListBtn.style.display = 'inline-block';
    } else {
      enableSubmit(true);
    }
  }

  startInput.addEventListener('change', updateFormState);
  endInput.addEventListener('change', updateFormState);

  if (eventType) {
    eventType.addEventListener('change', () => {
      otherEventBlock.style.display = eventType.value === 'other' ? 'block' : 'none';
    });
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      if (dateInput.value) onDateChange();
    });
  }

  modal?.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  // ====== Модальное окно подтверждения ======
  function showSuccessModal(message) {
    const successModal = document.getElementById('successModal');
    const successMsg = document.getElementById('successMessageText');
    const closeBtn = document.getElementById('closeSuccessBtn');

    if (!successModal || !successMsg) return;

    successMsg.textContent = message;
    successModal.style.display = 'flex';

    closeBtn.onclick = () => location.reload();
    successModal.onclick = e => {
      if (e.target === successModal) location.reload();
    };
  }

  // ====== Отправка формы ======
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const fd = new FormData(form);
    const obj = {};
    fd.forEach((value, key) => {
      if (obj[key]) {
        if (Array.isArray(obj[key])) obj[key].push(value);
        else obj[key] = [obj[key], value];
      } else obj[key] = value;
    });

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        formMessage.textContent = data.message || 'Ошибка при бронировании';
        return;
      }

      // успешное бронирование
      showSuccessModal(data.message || 'Бронирование успешно создано!');
      modal.style.display = 'none';
    } catch (err) {
      console.error(err);
      formMessage.textContent = 'Ошибка соединения с сервером.';
    }
  });

  // ====== Лист ожидания ======
  waitListBtn.addEventListener('click', async () => {
    const fd = new FormData(form);
    const payload = {
      hall_id: fd.get('hall_id'),
      date: fd.get('date'),
      start_time: fd.get('start_time'),
      end_time: fd.get('end_time')
    };

    try {
      const res = await fetch('/waiting-list', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        formMessage.textContent = data.message || 'Не удалось добавить в лист ожидания';
        return;
      }

      // успешное добавление в лист ожидания
      showSuccessModal(data.message || 'Вы добавлены в лист ожидания!');
      modal.style.display = 'none';
    } catch (err) {
      console.error(err);
      formMessage.textContent = 'Ошибка при добавлении в лист ожидания';
    }
  });

  
  

})();
