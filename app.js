const DEFAULT_POTIONS = [
  {
    id: "zelie-isceleniya",
    name: "Зелье исцеления",
    description: "Базовая версия лечебного зелья. Восстанавливает небольшое количество здоровья.",
    additionalDescription: "Имеет приятный розовый цвет и сладковатый вкус. Популярно среди искателей приключений любого уровня.",
    image: "",
    tags: ["лечебное", "базовое", "обычное"],
    properties: ["Восстанавливает 2d4+2 HP", "Не требует проверки"],
    composition: ["@Целебная трава (3 шт)", "@Очищенная вода", "Капля эликсира"]
  },
  {
    id: "zelie-nevidimosti",
    name: "Зелье невидимости",
    description: "Делает выпившего невидимым для глаз и магических способностей обнаружения.",
    additionalDescription: "Прозрачная жидкость с лёгким мерцанием. Эффект исчезает сразу после атаки или использования заклинания.",
    image: "",
    tags: ["магическое", "редкое"],
    properties: ["Невидимость 1d4+4 часа", "Исчезает после атаки", "Скрывает от обнаружения"],
    composition: ["@Слеза призрака", "@Эфирное крыло", "@Аманитовый гриб"]
  },
  {
    id: "zelie-velikoy-sili",
    name: "Зелье великой силы",
    description: "Увеличивает физическую силу выпившего до сверхчеловеческого уровня.",
    additionalDescription: "Ярко-красная густая жидкость. Придаёт ощущение невероятной мощи, но быстрое истощение мышц может быть опасным.",
    image: "",
    tags: ["усиление", "редкое", "магическое"],
    properties: ["+5 к проверкам Силы", "Может сломать оружие при критической силе", "Длится 1 час"],
    composition: ["@Сок титана", "@Кость великана", "@Железный корень"]
  }
];

let allPotions = [];
let allProperties = new Set();
let allTags = new Set();
let selectedProperties = [];
let selectedTags = [];
let defaultData = null;

async function loadDefaultData() {
    if (defaultData) return defaultData;
    try {
        const resp = await fetch('data.json');
        if (resp.ok) {
            defaultData = await resp.json();
            return defaultData;
        }
    } catch (e) {}
    return null;
}

async function loadPotions() {
    try {
        const stored = localStorage.getItem('potionwiki_potions');
        if (stored) {
            allPotions = JSON.parse(stored);
        } else {
            const data = await loadDefaultData();
            allPotions = (data && data.potions) ? data.potions : DEFAULT_POTIONS;
            localStorage.setItem('potionwiki_potions', JSON.stringify(allPotions));
        }
        extractProperties();
        extractTags();
        renderPotions(allPotions);
        populatePropertyDropdown();
        populateTagDropdown();

        const params = new URLSearchParams(window.location.search);
        const potionName = params.get('name');
        if (potionName) {
            const found = allPotions.find(p => p.name === potionName);
            if (found) {
                openModal(found);
            }
        }
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

    const compList = document.getElementById('modalComposition');
    compList.innerHTML = potion.composition ? renderComposition(potion.composition) : '';

    document.getElementById('modalAdditional').textContent = potion.additionalDescription || '';

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

function renderComposition(composition) {
    return composition.map(item => {
        if (item.startsWith('@')) {
            const name = item.slice(1);
            const extraMatch = name.match(/^(.+?)\s*\((.+)\)$/);
            const cleanName = extraMatch ? extraMatch[1].trim() : name;
            const extra = extraMatch ? extraMatch[2].trim() : '';

            const ingredients = JSON.parse(localStorage.getItem('potionwiki_ingredients') || '[]');
            const all = JSON.parse(localStorage.getItem('potionwiki_potions') || '[]').concat(ingredients);
            const found = all.find(i => i.name === cleanName);
            if (found) {
                const isIngredient = ingredients.some(i => i.id === found.id);
                const page = isIngredient ? 'ingredients.html' : 'index.html';
                const extraHtml = extra ? ` <span class="composition-extra">${extra}</span>` : '';
                return `<li><a href="${page}?name=${encodeURIComponent(cleanName)}" class="composition-link">${cleanName}</a>${extraHtml}</li>`;
            }
            return `<li><span class="composition-link missing">${cleanName}</span>${extra ? ` <span class="composition-extra">${extra}</span>` : ''}</li>`;
        }
        return `<li>${item}</li>`;
    }).join('');
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

    if (propToggle && !propDropdown.contains(e.target)) {
        propDropdown.classList.remove('open');
    }
    if (tagToggle && !tagDropdown.contains(e.target)) {
        tagDropdown.classList.remove('open');
    }
});

if (document.getElementById('propertyToggle')) {
    document.getElementById('propertyToggle').addEventListener('click', () => {
        const dropdown = document.getElementById('propertyMultiselect');
        const tagDropdown = document.getElementById('tagMultiselect');
        tagDropdown.classList.remove('open');
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
        propDropdown.classList.remove('open');
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