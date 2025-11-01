document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('hallTable');
    const headers = table.querySelectorAll('th');
    let sortDirection = Array(headers.length).fill('asc');

    // ===== СОРТИРОВКА =====
    headers.forEach((th, index) => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            sortTable(index, sortDirection[index]);
            sortDirection[index] = sortDirection[index] === 'asc' ? 'desc' : 'asc';
            updateSortArrows();
        });
    });

    function sortTable(column, direction) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.sort((a, b) => {
            let aText = a.cells[column].textContent.trim().replace('BYN', '');
            let bText = b.cells[column].textContent.trim().replace('BYN', '');
            let aNum = parseFloat(aText);
            let bNum = parseFloat(bText);

            if (!isNaN(aNum) && !isNaN(bNum)) return direction === 'asc' ? aNum - bNum : bNum - aNum;
            return direction === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
        });

        rows.forEach(row => tbody.appendChild(row));
    }

    function updateSortArrows() {
        headers.forEach((th, index) => {
            const arrow = th.querySelector('.sort-arrow');
            if (arrow) arrow.style.color = sortDirection[index] === 'asc' ? '#ae3962' : '#333';
        });
    } 

    // ===== МОДАЛКА =====
    const rows = table.querySelectorAll('tbody tr');
    const modal = document.getElementById('hallModal');
    const closeBtn = modal.querySelector('.close-modal');

    const hallName = document.getElementById('modalHallName');
    const hallImage = document.getElementById('modalHallImage');
    const hallRating = document.getElementById('modalHallRating');
    const hallDesc = document.getElementById('modalHallDesc');
    const hallCapacity = document.getElementById('modalHallCapacity');
    const hallPrice = document.getElementById('modalHallPrice');
    const hallAddress = document.getElementById('modalHallAddress');
    const hallStatusSelect = document.getElementById('modalHallStatus'); // теперь это select
    const hallManager = document.getElementById('modalHallManager');
    const saveBtn = document.getElementById('saveStatusBtn');

    let currentHallId = null;

    rows.forEach(row => {
        row.addEventListener('click', async () => {
            const hallId = row.dataset.id;
            currentHallId = hallId;

            try {
                const response = await fetch(`/admin/halls/${hallId}`);
                const hall = await response.json();

                hallName.textContent = hall.hall_name;
                hallImage.src = hall.image_path ? hall.image_path : '/img/default-hall.jpg';
                hallRating.textContent = hall.rating ?? '—';
                hallDesc.textContent = hall.description || '—';
                hallCapacity.textContent = hall.capacity || '—';
                hallPrice.textContent = hall.price || '—';
                hallAddress.textContent = hall.address || '—';
                hallManager.textContent = hall.managerFullName || '—';

                // Выбираем текущий статус
                hallStatusSelect.value = hall.status;

                modal.style.display = 'flex';
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                alert('Не удалось загрузить данные зала');
            }
        });
    });

    // ===== ЗАКРЫТИЕ МОДАЛКИ =====
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    // ===== СОХРАНЕНИЕ СТАТУСА =====
    saveBtn.addEventListener('click', async () => {
        if (!currentHallId) return;

        const newStatus = hallStatusSelect.value;

        try {
            const res = await fetch(`/admin/halls/${currentHallId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                alert('Статус успешно обновлён!');
                modal.style.display = 'none';
                location.reload();
            } else {
                const err = await res.json();
                alert('Ошибка при обновлении: ' + (err.message || 'неизвестная ошибка'));
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка соединения с сервером');
        }
    });
});
