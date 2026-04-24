const POTIONS_DIR = 'potions/';

let allPotions = [];
let allProperties = new Set();

async function loadPotions() {
    try {
        const response = await fetch(POTIONS_DIR + 'index.json');
        if (!response.ok) throw new Error('Failed to load index');
        const data = await response.json();
        allPotions = data.potions || [];
        extractProperties();
        renderPotions(allPotions);
        populatePropertyFilter();
    } catch (error) {
        console.error('Error loading potions:', error);
        document.getElementById('potionsList').innerHTML = '<p>Ошибка загрузки зелий</p>';
    }
}

function extractProperties() {
    allProperties.clear();
    allPotions.forEach(potion => {
        if (potion.properties) {
            potion.properties.forEach(prop => allProperties.add(prop));
        }
    });
}

function populatePropertyFilter() {
    const select = document.getElementById('propertyFilter');
    const options = Array.from(allProperties).sort();
    select.innerHTML = '<option value="">Все свойства</option>';
    options.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop;
        option.textContent = prop;
        select.appendChild(option);
    });
}

function renderPotions(potions) {
    const grid = document.getElementById('potionsList');
    grid.innerHTML = '';

    if (potions.length === 0) {
        grid.innerHTML = '<p>Зелья не найдены</p>';
        return;
    }

    potions.forEach(potion => {
        const card = document.createElement('div');
        card.className = 'potion-card';
        card.onclick = () => openModal(potion);

        const image = potion.image ? potion.image : '';
        const tagsHtml = potion.tags ? potion.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

        card.innerHTML = `
            ${image ? `<img class="potion-card-image" src="${image}" alt="${potion.name}" onerror="this.style.display='none'">` : ''}
            <h3>${potion.name}</h3>
            <p>${potion.description || ''}</p>
            <div class="potion-card-tags">${tagsHtml}</div>
        `;
        grid.appendChild(card);
    });
}

function filterPotions() {
    const search = document.getElementById('search').value.toLowerCase();
    const propertyFilter = document.getElementById('propertyFilter').value;

    let filtered = allPotions;

    if (search) {
        filtered = filtered.filter(potion =>
            potion.name.toLowerCase().includes(search)
        );
    }

    if (propertyFilter) {
        filtered = filtered.filter(potion =>
            potion.properties && potion.properties.includes(propertyFilter)
        );
    }

    renderPotions(filtered);
}

function openModal(potion) {
    const modal = document.getElementById('potionModal');
    document.getElementById('modalImage').src = potion.image || '';
    document.getElementById('modalImage').style.display = potion.image ? 'block' : 'none';
    document.getElementById('modalName').textContent = potion.name;
    document.getElementById('modalDescription').textContent = potion.description || '';

    const tagsHtml = potion.tags ? potion.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
    document.getElementById('modalTags').innerHTML = tagsHtml;

    const propsList = document.getElementById('modalProperties');
    propsList.innerHTML = potion.properties ? potion.properties.map(p => `<li>${p}</li>`).join('') : '';

    const ingList = document.getElementById('modalIngredients');
    ingList.innerHTML = potion.ingredients ? potion.ingredients.map(i => `<li>${i}</li>`).join('') : '';

    document.getElementById('modalAdditional').textContent = potion.additionalDescription || '';

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('potionModal').style.display = 'none';
}

if (document.getElementById('search')) {
    document.getElementById('search').addEventListener('input', filterPotions);
    document.getElementById('propertyFilter').addEventListener('change', filterPotions);
}

if (document.querySelector('.close')) {
    document.querySelector('.close').addEventListener('click', closeModal);
}

if (document.getElementById('potionModal')) {
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('potionModal')) {
            closeModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', loadPotions);