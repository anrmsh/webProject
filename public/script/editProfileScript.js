const form = document.getElementById("editProfileForm");
const saveBtn = document.getElementById("saveBtn");
const confirmModal = document.getElementById("confirmModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

const changePasswordBtn = document.getElementById("changePasswordBtn");
const passwordModal = document.getElementById("passwordModal");
const passwordSaveBtn = document.getElementById("passwordSaveBtn");
const passwordCancelBtn = document.getElementById("passwordCancelBtn");

// --- Подтверждение сохранения профиля ---
saveBtn.addEventListener("click", () => {
    confirmModal.style.display = "flex";
});

confirmNo.addEventListener("click", () => {
    confirmModal.style.display = "none";
    window.location.href = "/profile";
});

confirmYes.addEventListener('click', async () => {
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));

    try {
        const res = await fetch('/edit-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            window.location.href = '/profile';
        } else {
            const text = await res.text();
            alert(text); // Покажет, например: "Пользователь с таким логином уже существует"
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка сервера');
    }
});
 

// --- Смена пароля ---
changePasswordBtn.addEventListener("click", () => {
    passwordModal.style.display = "flex";
});

passwordCancelBtn.addEventListener("click", () => {
    passwordModal.style.display = "none";
});

passwordSaveBtn.addEventListener("click", async () => {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    if (!oldPassword || !newPassword) {
        alert("Введите оба пароля!");
        return;
    }

    try {
        const res = await fetch("/edit-profile/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword, newPassword }),
        });

        if (res.ok) {
            alert("Пароль успешно изменён");
            passwordModal.style.display = "none";
        } else {
            const text = await res.text();
            alert(text);
        }
    } catch (err) {
        console.error(err);
        alert("Ошибка при смене пароля");
    }
});