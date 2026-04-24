const DEFAULT_POTIONS = [
  {
    id: "zelie-isceleniya",
    name: "Зелье исцеления",
    description: "Базовая версия лечебного зелья. Восстанавливает небольшое количество здоровья.",
    additionalDescription: "Имеет приятный розовый цвет и сладковатый вкус. Популярно среди искателей приключений любого уровня.",
    image: "",
    tags: ["лечебное", "базовое", "обычное"],
    habitat: ["город", "подземелье"],
    properties: ["Восстанавливает 2d4+2 HP", "Не требует проверки"],
    ingredients: ["Целебная трава", "Очищенная вода", "Капля эликсира"]
  },
  {
    id: "zelie-nevidimosti",
    name: "Зелье невидимости",
    description: "Делает выпившего невидимым для глаз и магических способностей обнаружения.",
    additionalDescription: "Прозрачная жидкость с лёгким мерцанием. Эффект исчезает сразу после атаки или использования заклинания.",
    image: "",
    tags: ["магическое", "редкое"],
    habitat: ["подземелье"],
    properties: ["Невидимость 1d4+4 часа", "Исчезает после атаки", "Скрывает от обнаружения"],
    ingredients: ["Слеза призрака", "Эфирное крыло", "Аманитовый гриб"]
  },
  {
    id: "zelie-velikoy-sili",
    name: "Зелье великой силы",
    description: "Увеличивает физическую силу выпившего до сверхчеловеческого уровня.",
    additionalDescription: "Ярко-красная густая жидкость. Придаёт ощущение невероятной мощи, но быстрое истощение мышц может быть опасным.",
    image: "",
    tags: ["усиление", "редкое", "магическое"],
    habitat: ["город", "лес"],
    properties: ["+5 к проверкам Силы", "Может сломать оружие при критической силе", "Длится 1 час"],
    ingredients: ["Сок титана", "Кость великана", "Железный корень"]
  }
];

let allPotions = [];
let allProperties = new Set();
let allTags = new Set();
let allHabitats = new Set();
let selectedProperties = [];
let selectedTags = [];
let selectedHabitats = [];

async function loadPotions() {
    try {
        const stored = localStorage.getItem('potionwiki_potions');
        if (stored) {
            allPotions = JSON.parse(stored);
        } else {
            allPotions = DEFAULT_POTIONS;
            localStorage.setItem('potionwiki_potions', JSON.stringify(DEFAULT_POTIONS));
        }
        extractProperties();
        extractTags();
        extractHabitats();
        renderPotions(allPotions);
        populatePropertyDropdown();
        populateTagDropdown();
        populateHabitatDropdown();
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

function extractTags() {
    allTags.clear();
    allPotions.forEach(potion => {
        if (potion.tags) {
            potion.tags.forEach(tag => allTags.add(tag));
        }
    });
}

function extractHabitats() {
    allHabitats.clear();
    allPotions.forEach(potion => {
        if (potion.habitat) {
            potion.habitat.forEach(h => allHabitats.add(h));
        }
    });
}

function populatePropertyDropdown() {
    const dropdown = document.getElementById('propertyDropdown');
    const options = Array.from(allProperties).sort();
    dropdown.innerHTML = options.map(prop => `
        <label class="multiselect-option">
            <input type="checkbox" value="${prop}" ${selectedProperties.includes(prop) ? 'checked' : ''}>
            ${prop}
        </label>
    `).join('');

    updatePropertyLabel();
}

function populateTagDropdown() {
    const dropdown = document.getElementById('tagDropdown');
    const options = Array.from(allTags).sort();
    dropdown.innerHTML = options.map(tag => `
        <label class="multiselect-option">
            <input type="checkbox" value="${tag}" ${selectedTags.includes(tag) ? 'checked' : ''}>
            ${tag}
        </label>
    `).join('');

    updateTagLabel();
}

function populateHabitatDropdown() {
    const dropdown = document.getElementById('habitatDropdown');
    const options = Array.from(allHabitats).sort();
    dropdown.innerHTML = options.map(habitat => `
        <label class="multiselect-option">
            <input type="checkbox" value="${habitat}" ${selectedHabitats.includes(habitat) ? 'checked' : ''}>
            ${habitat}
        </label>
    `).join('');

    updateHabitatLabel();
}

function updatePropertyLabel() {
    const label = document.getElementById('propertyLabel');
    if (selectedProperties.length === 0) {
        label.textContent = 'Все свойства';
    } else if (selectedProperties.length === 1) {
        label.textContent = selectedProperties[0];
    } else {
        label.textContent = `Выбрано: ${selectedProperties.length}`;
    }
}

function updateTagLabel() {
    const label = document.getElementById('tagLabel');
    if (selectedTags.length === 0) {
        label.textContent = 'Все теги';
    } else if (selectedTags.length === 1) {
        label.textContent = selectedTags[0];
    } else {
        label.textContent = `Выбрано: ${selectedTags.length}`;
    }
}

function updateHabitatLabel() {
    const label = document.getElementById('habitatLabel');
    if (selectedHabitats.length === 0) {
        label.textContent = 'Все обитания';
    } else if (selectedHabitats.length === 1) {
        label.textContent = selectedHabitats[0];
    } else {
        label.textContent = `Выбрано: ${selectedHabitats.length}`;
    }
}

function renderPotions(potions) {
    const grid = document.getElementById('potionsList');
    grid.innerHTML = '';

    if (potions.length === 0) {
        grid.innerHTML = '<p class="no-results">Зелья не найдены</p>';
        return;
    }

    potions.forEach(potion => {
        const card = document.createElement('div');
        card.className = 'potion-card';
        card.onclick = () => openModal(potion);

        const image = potion.image || '';
        const tagsHtml = potion.tags ? potion.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

        card.innerHTML = `
            ${image ? `<img class="potion-card-image" src="${image}" alt="${potion.name}" onerror="this.style.display='none'">` : '<div class="potion-card-placeholder">🧪</div>'}
            <h3>${potion.name}</h3>
            <p>${potion.description || ''}</p>
            <div class="potion-card-tags">${tagsHtml}</div>
        `;
        grid.appendChild(card);
    });
}

function filterPotions() {
    const search = document.getElementById('search').value.toLowerCase();

    let filtered = allPotions;

    if (search) {
        filtered = filtered.filter(potion =>
            potion.name.toLowerCase().includes(search)
        );
    }

    if (selectedProperties.length > 0) {
        filtered = filtered.filter(potion =>
            potion.properties && selectedProperties.some(prop => potion.properties.includes(prop))
        );
    }

    if (selectedTags.length > 0) {
        filtered = filtered.filter(potion =>
            potion.tags && selectedTags.some(tag => potion.tags.includes(tag))
        );
    }

    if (selectedHabitats.length > 0) {
        filtered = filtered.filter(potion =>
            potion.habitat && selectedHabitats.some(h => potion.habitat.includes(h))
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

    const habitatList = document.getElementById('modalHabitat');
    habitatList.innerHTML = potion.habitat ? potion.habitat.map(h => `<li>${h}</li>`).join('') : '';

    document.getElementById('editPotionBtn').onclick = () => {
        closeModal();
        location.replace(`editor.html?id=${potion.id}`);
    };

    modal.style.display = 'block';
    modal.style.overflowY = 'auto';
}

function closeModal() {
    document.getElementById('potionModal').style.display = 'none';
}

if (document.getElementById('search')) {
    document.getElementById('search').addEventListener('input', filterPotions);
}

if (document.querySelector('.close')) {
    document.querySelector('.close').addEventListener('click', closeModal);
}

if (document.getElementById('potionModal')) {
    const modal = document.getElementById('potionModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    modal.addEventListener('touchstart', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    }, { passive: true });
}

document.addEventListener('click', (e) => {
    const propToggle = document.getElementById('propertyToggle');
    const propDropdown = document.getElementById('propertyMultiselect');
    const tagToggle = document.getElementById('tagToggle');
    const tagDropdown = document.getElementById('tagMultiselect');
    const habitatToggle = document.getElementById('habitatToggle');
    const habitatDropdown = document.getElementById('habitatMultiselect');

    if (propToggle && !propDropdown.contains(e.target)) {
        propDropdown.classList.remove('open');
    }
    if (tagToggle && !tagDropdown.contains(e.target)) {
        tagDropdown.classList.remove('open');
    }
    if (habitatToggle && !habitatDropdown.contains(e.target)) {
        habitatDropdown.classList.remove('open');
    }
});

if (document.getElementById('propertyToggle')) {
    document.getElementById('propertyToggle').addEventListener('click', () => {
        const dropdown = document.getElementById('propertyMultiselect');
        const tagDropdown = document.getElementById('tagMultiselect');
        const habitatDropdown = document.getElementById('habitatMultiselect');
        tagDropdown.classList.remove('open');
        habitatDropdown.classList.remove('open');
        dropdown.classList.toggle('open');
    });

    document.getElementById('propertyDropdown').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const value = e.target.value;
            if (e.target.checked) {
                selectedProperties.push(value);
            } else {
                selectedProperties = selectedProperties.filter(p => p !== value);
            }
            updatePropertyLabel();
            filterPotions();
        }
    });
}

if (document.getElementById('tagToggle')) {
    document.getElementById('tagToggle').addEventListener('click', () => {
        const dropdown = document.getElementById('tagMultiselect');
        const propDropdown = document.getElementById('propertyMultiselect');
        const habitatDropdown = document.getElementById('habitatMultiselect');
        propDropdown.classList.remove('open');
        habitatDropdown.classList.remove('open');
        dropdown.classList.toggle('open');
    });

    document.getElementById('tagDropdown').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const value = e.target.value;
            if (e.target.checked) {
                selectedTags.push(value);
            } else {
                selectedTags = selectedTags.filter(t => t !== value);
            }
            updateTagLabel();
            filterPotions();
        }
    });
}

if (document.getElementById('habitatToggle')) {
    document.getElementById('habitatToggle').addEventListener('click', () => {
        const dropdown = document.getElementById('habitatMultiselect');
        const propDropdown = document.getElementById('propertyMultiselect');
        const tagDropdown = document.getElementById('tagMultiselect');
        propDropdown.classList.remove('open');
        tagDropdown.classList.remove('open');
        dropdown.classList.toggle('open');
    });

    document.getElementById('habitatDropdown').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const value = e.target.value;
            if (e.target.checked) {
                selectedHabitats.push(value);
            } else {
                selectedHabitats = selectedHabitats.filter(h => h !== value);
            }
            updateHabitatLabel();
            filterPotions();
        }
    });
}

window.addEventListener('storage', () => {
    loadPotions();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope);

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('Доступна новая версия сайта. Обновить?')) {
                                newWorker.postMessage('skipWaiting');
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('SW registration failed:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', loadPotions);