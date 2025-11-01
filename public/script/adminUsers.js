document.addEventListener('DOMContentLoaded', () => {
    // === Модалка регистрации менеджера ===
    const modal = document.getElementById('managerModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModal');

    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // === Создание менеджера ===
    document.getElementById('managerForm').addEventListener('submit', async e => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target).entries());
        const response = await fetch('/admin/users/registerManager', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            alert('Менеджер успешно зарегистрирован!');
            location.reload();
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.error || 'Ошибка при регистрации менеджера');
        }
    });

    // === Цвета статусов ===
    document.querySelectorAll('.status-cell').forEach(td => {
        const text = td.textContent.trim();
        if (text === 'Активен') td.style.color = '#2ecc71';
        if (text === 'Заблокирован') td.style.color = '#e74c3c';
    });

    // === Карточка пользователя ===
    const card = document.getElementById('userCard');
    const closeCard = document.getElementById('closeCard');
    const saveBtn = document.getElementById('saveChangesBtn');
    const deleteBtn = document.getElementById('deleteUserBtn');
    const statusSelect = document.getElementById('statusSelect');

    let currentUser = null;
    let originalStatus = '';

    document.querySelectorAll('#userTable tbody tr').forEach(row => {
        row.addEventListener('click', () => {
            const user = JSON.parse(decodeHTML(row.dataset.user));
            currentUser = user;
            originalStatus = user.rawStatus || (user.status === 'Активен' ? 'active' : 'blocked');

            document.getElementById('cardName').textContent = user.first_name;
            document.getElementById('cardLast').textContent = user.last_name;
            document.getElementById('cardLogin').textContent = user.login;
            document.getElementById('cardRole').textContent = user.role;
            statusSelect.value = originalStatus;

            card.classList.add('active');
            deleteBtn.dataset.id = user.user_id;
        });
    });

    // Закрытие карточки
    closeCard.addEventListener('click', () => {
        if (statusSelect.value !== originalStatus) {
            if (confirm('Сохранить изменения перед закрытием?')) {
                saveBtn.click();
            } else {
                card.classList.remove('active');
            }
        } else {
            card.classList.remove('active');
        }
    });

    window.addEventListener('click', e => {
        if (e.target === card) {
            if (statusSelect.value !== originalStatus) {
                if (confirm('Сохранить изменения перед закрытием?')) {
                    saveBtn.click();
                } else {
                    card.classList.remove('active');
                }
            } else {
                card.classList.remove('active');
            }
        }
    });
 
    // === Сохранение изменений статуса ===
    saveBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const newStatus = statusSelect.value;

        try {
            const res = await fetch(`/admin/users/${currentUser.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                alert('Статус обновлён');
                card.classList.remove('active');
                location.reload();
            } else {
                // Читаем тело ответа от сервера
                const errData = await res.json().catch(() => ({}));
                alert(errData.error || 'Ошибка при обновлении статуса');
                console.error(errData.err || 'Нет подробностей ошибки');
            }
        } catch (e) {
            alert('Ошибка сети или сервера');
            console.error(e);
        }
    });

    // === Удаление пользователя ===
    deleteBtn.addEventListener('click', async () => {
        const id = deleteBtn.dataset.id;
        if (!confirm('Действительно хотите удалить пользователя?')) return;

        const res = await fetch(`/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Пользователь удалён');
            card.classList.remove('active');
            location.reload();
        } else {
            alert('Ошибка при удалении');
        }
    });





    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

});
