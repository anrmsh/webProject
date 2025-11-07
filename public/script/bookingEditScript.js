document.addEventListener('DOMContentLoaded', () => {
    let hallBookings = window.hallBookings || [];
    const booking = window.currentBooking || {};

    const startSelect = document.getElementById('startTime');
    const endSelect = document.getElementById('endTime');
    const datePicker = document.getElementById('datePicker');
    const hallId = document.querySelector('input[name="hall_id"]').value;
    const messageBox = document.getElementById('timeErrorMsg');

    const slots = [];
    for (let h = 8; h < 24; h++) {
        [0, 15, 30, 45].forEach(m => slots.push(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`));
    }

    function timeToMinutes(time) {
        const [h,m] = time.split(':').map(Number);
        return h*60 + m;
    }

    function isSlotBusy(time, selectedDate) {
        const tMinutes = timeToMinutes(time);
        return hallBookings.some(b => {
            if (b.booking_id === booking.booking_id) return false;
            if (b.date.split('T')[0] !== selectedDate) return false;
            const start = timeToMinutes(b.start_time);
            const end = timeToMinutes(b.end_time);
            return tMinutes >= start && tMinutes < end;
        });
    }

    function updateTimeOptions() {
        const selectedDate = datePicker.value;
        if (!selectedDate) return;

        startSelect.innerHTML = '';
        endSelect.innerHTML = '';

        slots.forEach(time => {
          
            const startOption = document.createElement('option');
            startOption.value = time;
            startOption.textContent = time;
            if (isSlotBusy(time, selectedDate) && time !== booking.start_time.slice(0,5)) {
                startOption.disabled = true;
                startOption.style.color = 'gray';
            }
            if (time === booking.start_time.slice(0,5)) startOption.selected = true;
            startSelect.appendChild(startOption);

           
            const endOption = document.createElement('option');
            endOption.value = time;
            endOption.textContent = time;
            if (isSlotBusy(time, selectedDate) && time !== booking.end_time.slice(0,5)) {
                endOption.disabled = true;
                endOption.style.color = 'gray';
            }
            if (time === booking.end_time.slice(0,5)) endOption.selected = true;
            endSelect.appendChild(endOption);
        });

        validateSelectedTime();
    }

    function validateSelectedTime() {
        const start = startSelect.value;
        const end = endSelect.value;
        const date = datePicker.value;

        if (!start || !end || !date) {
            messageBox.textContent = '';
            return;
        }

        const startBusy = isSlotBusy(start, date);
        const endBusy = isSlotBusy(end, date);

        if (startBusy || endBusy || timeToMinutes(end) <= timeToMinutes(start)) {
            messageBox.textContent = 'Вы выбрали неправильное или занятое время.';
            startSelect.classList.add('error');
            endSelect.classList.add('error');
        } else {
            messageBox.textContent = '';
            startSelect.classList.remove('error');
            endSelect.classList.remove('error');
        }
    }

    datePicker.addEventListener('change', async () => {
        const date = datePicker.value;
        try {
            const res = await fetch(`/bookings/slots?hall_id=${hallId}&date=${date}`);
            const data = await res.json();
            hallBookings = data.slots || [];
            updateTimeOptions();
        } catch(err) { console.error(err); }
    });

    startSelect.addEventListener('change', () => {
        const startMinutes = timeToMinutes(startSelect.value);
        Array.from(endSelect.options).forEach(opt => {
            if (timeToMinutes(opt.value) <= startMinutes && opt.value !== booking.end_time.slice(0,5)) {
                opt.disabled = true;
                opt.style.color = 'gray';
            } else if (!isSlotBusy(opt.value, datePicker.value)) {
                opt.disabled = false;
                opt.style.color = '';
            }
        });
        validateSelectedTime();
    });

    endSelect.addEventListener('change', validateSelectedTime);

    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    const totalText = document.getElementById('totalPrice');
    const hallPrice = parseFloat(document.getElementById('hallPrice').value);

    function updateTotal() {
        let total = hallPrice;
        serviceCheckboxes.forEach(cb => {
            if(cb.checked) total += parseFloat(cb.dataset.price);
        });
        totalText.textContent = total.toFixed(2);
    }
    serviceCheckboxes.forEach(cb => cb.addEventListener('change', updateTotal));
    updateTotal();

    updateTimeOptions();
});
