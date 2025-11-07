
document.addEventListener('DOMContentLoaded', () => {

    console.log(' profileScript.js успешно загружен');

    const today = new Date();

    const bookingBoxes = document.querySelectorAll('.booking-box');
    bookingBoxes.forEach(box => {
        const bookingDate = new Date(box.dataset.date);
       

        const statusEl = box.querySelector('.status-text');
        if (!statusEl) {
            console.warn(' Не найден .status-text внутри .booking-box:', box);
            return; 
        }
        const statusColors = {
            pending: 'gray',
            confirmed: 'green',
            cancelled: 'red',
            waiting_list: 'orange',
            waiting_confirmation: 'orange',
            past: 'black'
        };
        let status = box.dataset.status;

        if (bookingDate < today) {
            status = 'past';
            box.dataset.status = status;
            box.dataset.past = 'true';

            if (statusEl) {
                statusEl.textContent = 'Прошло';
                statusEl.style.color = statusColors[status];
            }

            box.querySelectorAll('.confirm-btn, .cancel-btn, .edit-btn, p').forEach(el => {
           
                if (el.tagName === 'P' && el.textContent.includes('Редактирование недоступно')) {
                    el.remove();
                } else if (el.classList.contains('confirm-btn') || el.classList.contains('cancel-btn') || el.classList.contains('edit-btn')) {
                    el.remove();
                }
            });

        } else if (status === 'cancelled' && bookingDate >= today) {
            box.dataset.past = 'false';
            statusEl.style.color = statusColors[status];

            box.querySelectorAll('.confirm-btn, .cancel-btn, .edit-btn, p').forEach(el => {
                if (el.tagName === 'P' && el.textContent.includes('Редактирование недоступно')) {
                    el.remove();
                } else if (el.classList.contains('confirm-btn') || el.classList.contains('cancel-btn') || el.classList.contains('edit-btn')) {
                    el.remove();
                }
            });

        }
        else {
            box.dataset.past = 'false';

            if (statusEl && statusColors[status]) {
                statusEl.style.color = statusColors[status];
            }
        }

    });


    async function confirmBooking(bookingId, button) {
        try {
            const res = await fetch(`/confirm-booking/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);

                const statusEl = button.closest('.content').querySelector('.status-text');
                if (statusEl) {
                    statusEl.textContent = 'Подтверждено';
                    statusEl.style.color = 'green';
                }
                button.remove(); 
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка сервера');
        }
    }

    function attachConfirmButtons() {
        const confirmButtons = document.querySelectorAll('.confirm-btn');
        confirmButtons.forEach(btn => {
            btn.addEventListener('click', () => confirmBooking(btn.dataset.id, btn));
        });
    }

    attachConfirmButtons();

    function filterBookings(filter) {
        const allBoxes = document.querySelectorAll('.booking-box');
        const today = new Date();

        allBoxes.forEach(box => {
            const boxStatus = box.dataset.status;
            const bookingDate = new Date(box.dataset.date);
            const isPast = bookingDate < today;

            let show = false;

            if (filter === 'all') {
                show = true;
            } else if (filter === 'pastBookings') {
                show = isPast;
            } else {
                show = boxStatus === filter
            }

            box.style.display = show ? 'block' : 'none';
        });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.filter;
            filterBookings(status);
        });
    });

    bookingBoxes.forEach(box => {
        const bookingDate = new Date(box.dataset.date);


        if (bookingDate < today) {
            const content = box.querySelector('.content');
            const rateBtn = document.createElement('button');
            rateBtn.classList.add('rate-btn');
            rateBtn.textContent = 'Оставить оценку';
            content.appendChild(rateBtn);

            const ratingBox = document.createElement('div');
            ratingBox.classList.add('rating-box');
            ratingBox.style.display = 'none';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.classList.add('star');
                star.dataset.value = i;
                star.innerHTML = '&#9733;';
                ratingBox.appendChild(star);
            }
            content.appendChild(ratingBox);

            const modal = document.createElement('div');
            modal.classList.add('rating-modal');
            modal.style.display = 'none';
            modal.innerHTML = `
            <div class="modal-content">
                <p>Ваш прошлый отзыв: <span class="prev-rating"></span> ★</p>
                <p>Продолжить?</p>
                <button class="continue-btn">Да</button>
                <button class="cancel-btn">Нет</button>
            </div>
        `;
            content.appendChild(modal);


            rateBtn.addEventListener('click', () => {
                if (rateBtn.textContent === 'Оставить оценку') {
                    ratingBox.style.display = 'flex';
                } else {
                    const prevRating = box.dataset.lastRating || '0';
                    modal.querySelector('.prev-rating').textContent = prevRating;
                    modal.style.display = 'flex';
                }
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            modal.querySelector('.continue-btn').addEventListener('click', () => {
                modal.style.display = 'none';
                ratingBox.style.display = 'flex';

                const prevRating = parseInt(box.dataset.lastRating);
                const stars = ratingBox.querySelectorAll('.star');
                stars.forEach(s => {
                    s.style.color = s.dataset.value <= prevRating ? 'gold' : 'gray';
                });
            });


        }
    })

    async function handleStarClick(star, box, rateBtn, ratingBox) {
        const value = parseInt(star.dataset.value);
        const stars = ratingBox.querySelectorAll('.star');

        stars.forEach(s => s.style.color = s.dataset.value <= value ? 'gold' : 'gray');

        const bookingId = box.dataset.id;
        const hallId = box.dataset.hallId;

        try {
            const res = await fetch('/rate-hall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, hallId, score: value })
            });

            const data = await res.json();
            if (res.ok) {

                box.dataset.lastRating = value;

                ratingBox.style.display = 'none';

                rateBtn.textContent = 'Изменить оценку';

                alert(`Спасибо за отзыв! Средняя оценка зала: ${data.avgRating.toFixed(1)}`);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка сервера');
        }
    }

    document.querySelectorAll('.booking-box').forEach(box => {
        const rateBtn = box.querySelector('.rate-btn');
        const ratingBox = box.querySelector('.rating-box');

        if (!rateBtn || !ratingBox) return;

        const stars = ratingBox.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => handleStarClick(star, box, rateBtn, ratingBox));
        });
    });

    document.addEventListener('click', async (e) => {
        const button = e.target;
        if (button.classList.contains('cancel-btn') && button.dataset.id) {
            const bookingId = button.dataset.id;
            console.log('Кнопка отмены нажата! ID:', bookingId);
            if (!confirm('Вы уверены, что хотите отменить бронь?')) return;

            try {
                const res = await fetch(`/cancel-booking/${bookingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (res.ok) {
                    alert(data.message);
                    const statusEl = button.closest('.content').querySelector('.status-text');
                    if (statusEl) {
                        statusEl.textContent = 'Отменено';
                        statusEl.style.color = 'red';
                    }

                    const confirmBtn = button.closest('.content').querySelector('.confirm-btn');
                    if (confirmBtn) confirmBtn.remove();
                    button.remove();
                } else {
                    alert(data.message);
                    location.reload();
                }
            } catch (err) {
                console.error(err);
                alert('Ошибка при отмене брони');
            }
        }
    });

    async function autoCancelPastBookings() {
        try {
            const res = await fetch('/auto-cancel-bookings', {
                method: 'PATCH'
            });

            const data = await res.json();
            console.log(data.message);
        } catch (err) {
            console.error('Ошибка автоотмены:', err);
        }
    }

    autoCancelPastBookings();

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('cancel-wait-btn')) {
            const waitingId = e.target.dataset.id;
            if (!confirm('Вы уверены, что хотите отказаться от листа ожидания?')) return;

            try {
                const res = await fetch(`/cancel-waiting/${waitingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (res.ok) {
                    alert(data.message);
                    e.target.closest('.booking-box').remove();
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error(err);
                alert('Ошибка сервера');
            }
        }
    });


});
