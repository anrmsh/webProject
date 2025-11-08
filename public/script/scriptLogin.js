const container = document.querySelector('.container');

const registerBtn = document.querySelector('.register-btn');

const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    clearErrorMessages();
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    clearErrorMessages();
});

function clearErrorMessages() {
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginError) loginError.remove();
    if (registerError) registerError.remove();
}


document.addEventListener("DOMContentLoaded", () => {



    const loginBtn = document.querySelector('.form-box.login .btn');

    const container = document.getElementById('mainContainer');
    const registerBtn = document.getElementById('registerToggle');
    const loginToggleBtn = document.getElementById('loginToggle');

    registerBtn.addEventListener('click', () => container.classList.add('active'));
    loginToggleBtn.addEventListener('click', () => container.classList.remove('active'));

    const registerForm = document.querySelector('.form-box.register form');

    registerForm.addEventListener('submit', (e) => {
        const passwordInput = registerForm.querySelector('input[name="password"]');
        if (passwordInput.value.length < 6) {
            e.preventDefault();
            alert('Пароль должен содержать минимум 6 символов');
            passwordInput.classList.add('input-error');
        }

        const phoneInput = registerForm.querySelector('#phone');
        const countrySelect = registerForm.querySelector('#country_code');

        const countryCode = countrySelect.value;
        const phoneNumber = phoneInput.value.replace(/\D/g, '');

        // Проверка номера в зависимости от страны
        let valid = true;
        let errorMessage = '';

        switch (countryCode) {
            case '+375':
                if (phoneNumber.length !== 9) {
                    valid = false;
                    errorMessage = 'Для Беларуси номер должен содержать 9 цифр после кода страны';
                }
                break;
            case '+7':
                if (phoneNumber.length !== 10) {
                    valid = false;
                    errorMessage = 'Для России номер должен содержать 10 цифр после кода страны';
                }
                break;
        }

        if (!valid) {
            e.preventDefault();
            alert(errorMessage);
            phoneInput.classList.add('input-error');
            return;
        }

        phoneInput.value = countryCode + phoneNumber;


        // Проверка ввода имени и фамилии (только буквы)
        const firstNameInput = registerForm.querySelector('input[name="first_name"');
        const lastNameInput = registerForm.querySelector('input[name="last_name"]');

        const nameRegex = /^[A-Za-zА-Яа-яЁё]+$/;

        if (!nameRegex.test(firstNameInput.value)) {
            e.preventDefault();
            alert('Имя должно содержать только буквы');
            firstNameInput.classList.add('input-error');
            return;
        }

        if (!nameRegex.test(lastNameInput.value)) {
            e.preventDefault();
            alert('Фамилия должна содержать только буквы')
            return;
        }

        firstNameInput.value = firstNameInput.value[0].toUpperCase() + firstNameInput.value.slice(1).toLowerCase();

        lastNameInput.value = lastNameInput.value[0].toUpperCase() + lastNameInput.value.slice(1).toLowerCase();
    });



    // Если логин уже занят
    if (window.showRegister) {
        container.classList.add('active');
    }

    if (window.invalidLogin) {
        const loginInput = document.querySelector('.form-box.register input[name="login"]');
        if (loginInput) {
            loginInput.classList.add('input-error');
            loginInput.value = "";
        }
    }

    if (window.serverMessage) {
        const activeBtn = document.querySelector('.form-box.active .btn') ||
            document.querySelector('.form-box.login .btn');
        if (activeBtn) {
            activeBtn.classList.add('shake');
            setTimeout(() => activeBtn.classList.remove('shake'), 600);
        }
    }
});
