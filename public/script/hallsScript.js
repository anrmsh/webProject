const cards = Array.from(document.querySelectorAll('.hall-card'));
const container = document.getElementById('hallContainer');

const filters = {
    search: document.getElementById('search'),
    capacityMin: document.getElementById('capacityMin'),
    capacityMax: document.getElementById('capacityMax'),
    priceMin: document.getElementById('priceMin'),
    priceMax: document.getElementById('priceMax'),
    sort: document.getElementById('sort'),
};


function applyFilters() {
    let filtered = cards;

    const searchValue = filters.search.value.toLowerCase().trim();
    if (searchValue) filtered = filtered.filter(c => c.dataset.name.includes(searchValue));

    const capMin = parseInt(filters.capacityMin.value) || 0;
    const capMax = parseInt(filters.capacityMax.value) || Infinity;
    filtered = filtered.filter(c => {
        const cap = parseInt(c.dataset.capacity);
        return cap >= capMin && cap <= capMax;
    });

    const priceMin = parseInt(filters.priceMin.value) || 0;
    const priceMax = parseInt(filters.priceMax.value) || Infinity;
    filtered = filtered.filter(c => {
        const price = parseFloat(c.dataset.price);
        return price >= priceMin && price <= priceMax;
    });

    const sort = filters.sort.value;
    if (sort) {
        filtered.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price);
            const priceB = parseFloat(b.dataset.price);
            const ratingA = parseFloat(a.dataset.rating);
            const ratingB = parseFloat(b.dataset.rating);

            if (sort === 'price_asc') return priceA - priceB;
            if (sort === 'price_desc') return priceB - priceA;
            if (sort === 'rating_asc') return ratingA - ratingB;
            if (sort === 'rating_desc') return ratingB - ratingA;
        });
    }

    container.innerHTML = '';
    filtered.forEach(c => container.appendChild(c));
}

Object.values(filters).forEach(input => {
    input.addEventListener('input', applyFilters);
});

filters.capacityMin.addEventListener('input', () => {
    const minVal = parseInt(filters.capacityMin.value);
    if (minVal < 0) {
        alert('Вместимость не может быть меньше 0');
        filters.capacityMin.value = '';
        return;
    }
});

filters.capacityMax.addEventListener('input', () => {
    const maxVal = parseInt(filters.capacityMax.value);
    const minVal = parseInt(filters.capacityMin.value);

    if (maxVal < 0) {
        alert('Вместимость не может быть меньше 0.');
        filters.capacityMax.value = '';
        return;
    }

    if (maxVal < minVal) {
        alert('Вместимость "До" не может быть меньше "От"');
        filters.capacityMax.value = '';
    }
})

document.getElementById('checkDate').addEventListener('click', async () => {
    const date = document.getElementById('date').value;
    if (!date) return alert('Выберите дату!');

    try {
        const res = await fetch(`/halls?date=${date}`);
        const html = await res.text();

        const temp = document.createElement('div');
        temp.innerHTML = html;

        const newContainer = temp.querySelector('#hallContainer');
        if (newContainer) {
            container.innerHTML = newContainer.innerHTML;
        } else {
            document.body.innerHTML = html;
        }
    } catch (err) {
        console.error('Ошибка при загрузке залов:', err);
        alert('Ошибка при загрузке данных');
    }
});
