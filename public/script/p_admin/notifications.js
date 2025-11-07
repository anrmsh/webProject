async function updateStatus(hallId, status) {
  try {
    const response = await fetch(`/admin/notifications/${hallId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (data.success) {
      alert(` ${data.message}`);
      document.querySelector(`[data-id="${hallId}"]`)?.remove();
    } else {
      alert(` ${data.message}`);
    }
  } catch (err) {
    console.error('Ошибка:', err);
    alert('Ошибка при обновлении статуса');
  }
}

document.addEventListener('click', async (e)=> {
    const btn = e.target.closest('button[data-action]');
    if(btn){
        const card = btn.closest('.notification-card');
        const hallId = card.dataset.id;
        const status = btn.dataset.action;
        await updateStatus(hallId, status);
        return;
    }  
 
    const toggleBtn = e.target.closest('.toggle-details');
    if(toggleBtn) {
        const card = toggleBtn.closest('.notification-card');
        const details = card.querySelector('.card-details');
        if(details.style.display === 'block'){
            details.style.display = 'none';
            toggleBtn.textContent = '▼';
        } else {
            details.style.display = 'block';
            toggleBtn.textContent = '▲';
        }
    }
});