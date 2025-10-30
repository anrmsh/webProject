const today = new Date();

const bookingBoxes = document.querySelectorAll('.booking-box');
bookingBoxes.forEach(box => {
    const bookingDate = new Date(box.dataset.date);
    box.dataset.past = bookingDate < today ? 'true' : 'false';
});




document.addEventListener('DOMContentLoaded', () => {
    // Функция подтверждения брони
    async function confirmBooking(bookingId, button) {
        try {
            const res = await fetch(`/confirm-booking/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                // Меняем статус на странице без перезагрузки
                const statusEl = button.closest('.content').querySelector('.status-text');
                if (statusEl) {
                    statusEl.textContent = 'Подтверждено';
                    statusEl.style.color = 'green';
                }
                button.remove(); // удаляем кнопку после подтверждения
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка сервера');
        }
    }

    // Привязка кнопок подтверждения
    function attachConfirmButtons() {
        const confirmButtons = document.querySelectorAll('.confirm-btn');
        confirmButtons.forEach(btn => {
            btn.addEventListener('click', () => confirmBooking(btn.dataset.id, btn));
        });
    }

    attachConfirmButtons();

    //  Фильтр бронирований 
    function filterBookings(status) {
        const allBoxes = document.querySelectorAll('.booking-box');


        allBoxes.forEach(box => {
            const boxStatus = box.dataset.status; // status: pending, confirmed, cancelled, waiting_list, waiting_confirmation
            const isPast = box.dataset.past === 'true';
            if (status === 'all' || boxStatus === status || isPast) {
                box.style.display = 'block';
            } else {
                box.style.display = 'none';
            }
        });
    }

    //  Привязка фильтров 
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.filter;
            filterBookings(status);
        });
    });

    //write some function of rating
    const today = new Date();

    const bookingBoxes = document.querySelectorAll('.booking-box');
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



            // Модальное окно для изменения оценки
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





            //прошлая 
            // rateBtn.addEventListener('click', () => {
            //     ratingBox.style.display = ratingBox.style.display === 'none' ? 'flex' : 'none';
            // });
            //прошлая 

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

                // подсветка предыдущей оценки
                const prevRating = parseInt(box.dataset.lastRating);
                const stars = ratingBox.querySelectorAll('.star');
                stars.forEach(s => {
                    s.style.color = s.dataset.value <= prevRating ? 'gold' : 'gray';
                });
            });


        }
    })

    // async function handleStarClick(star, box) {
    //     const value = parseInt(star.dataset.value);
    //     const stars = box.querySelectorAll('.star');
    //     const rateBtn = box.querySelector('.rate-btn');

    //     stars.forEach(s => {
    //         s.style.color = s.dataset.value < value ? 'gold' : 'gray';
    //     });

    //     const bookingId = box.dataset.id;
    //     const hallId = box.dataset.hallId;

    //     try {
    //         const res = await fetch('/rate-hall', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ bookingId, hallId, score: value })
    //         });

    //         const data = await res.json();
    //         if (res.ok) {
    //             if (rateBtn) {
    //                 rateBtn.textContent = 'Изменить оценку';
    //             }
    //             alert(`Спасибо за отзыв! Средняя оценка зала: ${data.avgRating.toFixed(1)}`)
    //         } else {
    //             alert(data.message);
    //         }
    //     } catch (err) {
    //         console.error(err);
    //         alert('Ошибка сервера');
    //     }
    // }



    async function handleStarClick(star, box, rateBtn, ratingBox) {
        const value = parseInt(star.dataset.value);
        const stars = ratingBox.querySelectorAll('.star');

        // Подсветка выбранных звезд
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
                // Сохраняем последнюю оценку для карточки
                box.dataset.lastRating = value;

                // Скрываем звезды после оценки
                ratingBox.style.display = 'none';

                // Меняем кнопку на "Изменить оценку"
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




    // document.querySelectorAll('.booking-box').forEach(box => {
    //     const stars = box.querySelectorAll('.star');
    //     stars.forEach(star => {
    //         star.addEventListener('click', () => handleStarClick(star, box))
    //     });
    // });


    document.querySelectorAll('.booking-box').forEach(box => {
        const rateBtn = box.querySelector('.rate-btn');
        const ratingBox = box.querySelector('.rating-box');

        const stars = ratingBox.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => handleStarClick(star, box, rateBtn, ratingBox));
        });
    });



});
