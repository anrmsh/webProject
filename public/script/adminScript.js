document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async e => {
            const userId = e.target.dataset.id;
            const status = e.target.value;

            try {
                const res = await fetch(`/user/${userId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });

                const data = await res.json();
                if (data.success) alert('Статус пользователя обновлен');
                else alert('Ошибка обновления');
            } catch (err) {
                console.error(err);
                alert('Ошибка запроса');
            }
        });
    });

 // Календарь событий
 const calenderDate = document.getElementById('calenderDate');
 const calenderInfo = document.getElementById('calenderInfo');

 calenderDate?.addEventListener('change', async e=>{
    const date = e.target.value;
    try {
        const res = await fetch(`/calendar?date=${date}`);
        const data = await res.json();

        calenderInfo.innerHTML = '';
        if(data.length === 0){
            calenderInfo.innerHTML = '<p>Событий нет</p>';
        } else {
            data.forEach(b=>{
                const p = document.createElement('p');
                p.innerHTML =  `<strong>${b.hall_name}</strong> — бронирований: ${b.count}`;
                calenderInfo.appendChild(p);
            });
        }
    } catch (err) {
      console.error(err);
    }
 });

});