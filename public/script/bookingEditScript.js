document.addEventListener('DOMContentLoaded', () => {
    // ==============================
    // 🔹 Переменные и данные
    // ==============================
    let hallBookings = window.hallBookings || [];
    const booking = window.currentBooking || {};

    const startSelect = document.getElementById('startTime');
    const endSelect = document.getElementById('endTime');
    const datePicker = document.getElementById('datePicker');
    const hallId = document.querySelector('input[name="hall_id"]').value;

    // ==============================
    // 🔹 Генерация списка времени
    // ==============================
    function timeToStr(h, m) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const slots = [];
    for (let h = 8; h < 24; h++) {
        slots.push(timeToStr(h, 0));
        slots.push(timeToStr(h, 15));
        slots.push(timeToStr(h, 30));
        slots.push(timeToStr(h, 45));
    }

    // ==============================
    // 🔹 Проверка: занято ли время
    // ==============================
    function normalizeTime(t) {
        return t.length > 5 ? t.slice(0, 5) : t;
    }

    function isSlotBusy(time, selectedDate) {
        if (!selectedDate) return false;

        // выбираем только брони на выбранную дату
        const bookingsForDate = hallBookings.filter(
            (b) => b.date.split('T')[0] === selectedDate
        );

        return bookingsForDate.some((b) => {
            if (b.booking_id === booking.booking_id) return false; // игнорируем текущую бронь
            const start = normalizeTime(b.start_time);
            const end = normalizeTime(b.end_time);
            return time >= start && time < end;
        });
    }

    // ==============================
    // 🔹 Перестройка списков времени
    // ==============================
    function updateTimeOptions() {
        const selectedDate = datePicker.value;
        if (!selectedDate) return;

        startSelect.innerHTML = '';
        endSelect.innerHTML = '';

        slots.forEach((time) => {
            // --- начало ---
            const startOption = document.createElement('option');
            startOption.value = time;
            startOption.textContent = time;

            if (isSlotBusy(time, selectedDate) && time !== booking.start_time) {
                startOption.disabled = true;
                startOption.style.color = 'gray';
            }
            if (normalizeTime(time) === normalizeTime(booking.start_time)) startOption.selected = true;
            startSelect.appendChild(startOption);

            // --- конец ---
            const endOption = document.createElement('option');
            endOption.value = time;
            endOption.textContent = time;

            if (isSlotBusy(time, selectedDate) && time !== booking.end_time) {
                endOption.disabled = true;
                endOption.style.color = 'gray';
            }
            if (normalizeTime(time) === normalizeTime(booking.end_time)) endOption.selected = true;
            endSelect.appendChild(endOption);
        });

        validateSelectedTime();
    }

    // ==============================
    // 🔹 Проверка выбранного времени
    // ==============================
    function validateSelectedTime() {
        const selectedDate = datePicker.value;
        const startValue = startSelect.value;
        const endValue = endSelect.value;

        if (!selectedDate || !startValue || !endValue) return;

        const startBusy = isSlotBusy(startValue, selectedDate);
        const endBusy = isSlotBusy(endValue, selectedDate);

        if (startBusy || endBusy) {
            alert('Вы выбрали время, которое уже занято. Пожалуйста, выберите другое.');
            updateTimeOptions();
        }
    }

    // ==============================
    // 🔹 При смене даты
    // ==============================
    datePicker.addEventListener('change', async () => {
        const selectedDate = datePicker.value;
        try {
            const res = await fetch(
                `/bookings/slots?hall_id=${hallId}&date=${selectedDate}&booking_id=${booking.booking_id}`
            );
            if (!res.ok) throw new Error('Ошибка загрузки');
            const updatedBookings = await res.json();
            hallBookings = updatedBookings;
            updateTimeOptions();
        } catch (err) {
            console.error('Ошибка загрузки броней:', err);
        }
    });

    // ==============================
    // 🔹 При смене времени
    // ==============================
    startSelect.addEventListener('change', () => {
        const startValue = startSelect.value;
        const selectedDate = datePicker.value;

        Array.from(endSelect.options).forEach((opt) => {
            if (opt.value <= startValue && opt.value !== booking.end_time) {
                opt.disabled = true;
                opt.style.color = 'gray';
            } else if (!isSlotBusy(opt.value, selectedDate)) {
                opt.disabled = false;
                opt.style.color = '';
            }
        });

        validateSelectedTime();
    });

    endSelect.addEventListener('change', validateSelectedTime);

    // ==============================
    // 🔹 Пересчёт общей стоимости
    // ==============================
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    const totalText = document.getElementById('totalPrice');
    const hallPriceInput = document.getElementById('hallPrice');

    let basePrice = 0;
    if (hallPriceInput) {
        basePrice = parseFloat(hallPriceInput.value);
    } else if (window.currentBooking && window.currentBooking.BanquetHall) {
        basePrice = parseFloat(window.currentBooking.BanquetHall.price);
    }

    function updateTotal() {
        let total = basePrice;
        serviceCheckboxes.forEach((cb) => {
            if (cb.checked) total += parseFloat(cb.dataset.price);
        });
        totalText.textContent = total.toFixed(2);
    }

    serviceCheckboxes.forEach((cb) => cb.addEventListener('change', updateTotal));
    updateTotal();

    // ==============================
    // 🔹 Первичная инициализация
    // ==============================
    updateTimeOptions();
    restoreSelectedTimes();


    // После обновления списков времени всегда устанавливаем текущее время брони 
    function restoreSelectedTimes() {
        if (booking.start_time) {
            startSelect.value = normalizeTime(booking.start_time);
        }
        if (booking.end_time) {
            endSelect.value = normalizeTime(booking.end_time);
        }
    }

});


