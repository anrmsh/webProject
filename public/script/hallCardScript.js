(function () {
  if (!window.__INITIAL_DATA__) {
    console.error('Initial data not found');
    return;
  }

  const { hall, services, disabledDates } = window.__INITIAL_DATA__;

  const basePrice = parseFloat(hall.price ?? 0);

  // Элементы формы и модалки
  const modal = document.getElementById('bookingModal');
  const bookBtn = document.getElementById('bookBtn');
  const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
  const totalPriceEl = document.getElementById('totalPrice');
  const dateInput = document.getElementById('datePicker');

  // Инициализация flatpickr
  if (typeof flatpickr !== 'undefined' && dateInput) {
    flatpickr(dateInput, {
      dateFormat: "Y-m-d",
      disable: disabledDates || [],
      locale: "ru"
    });
  }

  // Функция пересчёта общей стоимости
  function recalcTotal() {
    let total = basePrice;
    serviceCheckboxes.forEach(cb => {
      if (cb.checked) {
        const price = parseFloat(cb.dataset.price || 0);
        total += isNaN(price) ? 0 : price;
      }
    });
    if (totalPriceEl) totalPriceEl.textContent = total.toFixed(2);
  }

  serviceCheckboxes.forEach(cb => cb.addEventListener('change', recalcTotal));
  recalcTotal();

  // Открытие модального окна
  if (bookBtn && modal) {
    bookBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  // Закрытие модалки при клике вне формы
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
})();
