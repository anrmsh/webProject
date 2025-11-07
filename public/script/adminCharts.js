document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js не загружен');
    return;
  }
 
  const bookingsCanvas = document.getElementById('bookingsChart');
  if (bookingsCanvas) {
    const bookingsCtx = bookingsCanvas.getContext('2d');
    new Chart(bookingsCtx, {
      type: 'line',
      data: {
        labels: window.chartLabels,
        datasets: [{
          label: 'Количество бронирований',
          data: window.chartData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: 'Дата' } },
          y: { title: { display: true, text: 'Бронирования' }, beginAtZero: true }
        }
      }
    });
  }

  const hallCanvas = document.getElementById('hallChart');
  if (hallCanvas && window.hallSums) {
    const hallCtx = hallCanvas.getContext('2d');
    const hallNames = Object.keys(window.hallSums);
    const hallData = Object.values(window.hallSums);

    new Chart(hallCtx, {
      type: 'bar',
      data: {
        labels: hallNames,
        datasets: [{
          label: 'Сумма бронирований (₽)',
          data: hallData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: 'Залы' } },
          y: { title: { display: true, text: 'Сумма бронирований' }, beginAtZero: true }
        }
      }
    });
  }
});
