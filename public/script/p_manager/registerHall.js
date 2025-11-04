document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addHallForm');
    const modal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const modalClose = document.getElementById('modalClose');
    const modalIcon = document.getElementById('modalIcon');

    const imageInput = document.getElementById('image_path');
    const imagePreview = document.getElementById('hallPreview');
    const placeholderText = document.querySelector('.hall-image-preview .placeholder-text');

    imageInput.addEventListener('input', () => {
        const url = imageInput.value.trim();
        if (url) {
            imagePreview.src = url;
            imagePreview.style.display = 'block';
            placeholderText.style.display = 'none';
        } else {
            imagePreview.style.display = 'none';
            placeholderText.style.display = 'block';
        }
    });

    modalClose.onclick = () => {
        modal.style.display = 'none';
        // редирект на главную страницу менеджера
        window.location.href = '/manager';
    };



    function showModal({ title, message, type = 'success', duration = 3000 }) {
        modalTitle.textContent = title;
        modalText.textContent = message;
        modal.style.display = 'flex';

        modalIcon.innerHTML = type === 'success'
            ? '<i class="fa-solid fa-circle-check"></i>'
            : '<i class="fa-solid fa-circle-xmark"></i>';
        modalIcon.style.color = type === 'success' ? 'green' : 'red';

        // закрытие по кнопке
        modalClose.onclick = () => modal.style.display = 'none';

        // авто-скрытие
        if (duration > 0) {
            setTimeout(() => {
                modal.style.display = 'none';
            }, duration);
        }
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const res = await fetch('/manager/register-hall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Ошибка запроса');

            const result = await res.json();

            showModal({
                title: result.title || 'Успех!',
                message: result.message || 'Заявление отправлено успешно.',
                type: result.success ? 'success' : 'error',
                duration: 3000
            });

            if (result.success) {
                form.reset();
                modalClose.onclick = () => {
                    modal.style.display = 'none';
                    window.location.href = '/manager';
                };
            } else {
                modalClose.onclick = () => modal.style.display = 'none';
            };

        } catch (err) {
            console.error(err);
            showModal({
                title: 'Ошибка',
                message: 'Не удалось отправить данные. Попробуйте позже.',
                type: 'error',
                duration: 4000
            });
        }
    });
});
