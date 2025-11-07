const container = document.querySelector('.container');

const registerBtn = document.querySelector('.register-btn');

const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})
  

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.querySelector('.form-box.login .btn');

    const container = document.getElementById('mainContainer');
    const registerBtn = document.getElementById('registerToggle');
    const loginToggleBtn = document.getElementById('loginToggle');

    registerBtn.addEventListener('click', () => container.classList.add('active'));
    loginToggleBtn.addEventListener('click', () => container.classList.remove('active'));
 
    if (window.serverMessage) {
        loginBtn.classList.add('shake');

        setTimeout(() => {
            loginBtn.classList.remove('shake');
        }, 500);
    }
});
