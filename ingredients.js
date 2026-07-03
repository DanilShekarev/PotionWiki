let allIngredients = [];
let allProperties = new Set();
let allTags = new Set();
let selectedProperties = [];
let selectedTags = [];

async function loadIngredients() {
    try {
        const stored = localStorage.getItem('potionwiki_ingredients');
        if (stored) {
            allIngredients = JSON.parse(stored);
        } else {
            allIngredients = [];
        }
        extractProperties();
        extractTags();
        renderIngredients(allIngredients);
        populatePropertyDropdown();
        populateTagDropdown();

        const params = new URLSearchParams(window.location.search);
        const ingredientName = params.get('name');
        if (ingredientName) {
            const found = allIngredients.find(i => i.name === ingredientName);
            if (found) {
                openModal(found);
            }
        }
    } catch (error) {
        console.error('Error loading ingredients:', error);
        document.getElementById('potionsList').innerHTML = '<p>Ошибка загрузки ингредиентов</p>';
    }
}

function extractProperties() {
    allProperties.clear();
    allIngredients.forEach(item => {
        if (item.properties) {
            item.properties.forEach(prop => allProperties.add(prop));
        }
    });
}

function extractTags() {
    allTags.clear();
    allIngredients.forEach(item => {
        if (item.tags) {
            item.tags.forEach(tag => allTags.add(tag));
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

function renderIngredients(ingredients) {
    const grid = document.getElementById('potionsList');
    grid.innerHTML = '';

    if (ingredients.length === 0) {
        grid.innerHTML = '<p class="no-results">Ингредиенты не найдены</p>';
        return;
    }

    ingredients.forEach(item => {
        const card = document.createElement('div');
        card.className = 'potion-card';
        card.onclick = () => openModal(item);

        const image = item.image || '';
        const tagsHtml = item.tags ? item.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';

        card.innerHTML = `
            ${image ? `<img class="potion-card-image" src="${image}" alt="${item.name}" onerror="this.style.display='none'">` : '<div class="potion-card-placeholder">🌿</div>'}
            <h3>${item.name}</h3>
            <p>${item.description || ''}</p>
            <div class="potion-card-tags">${tagsHtml}</div>
        `;
        grid.appendChild(card);
    });
}

function filterIngredients() {
    const search = document.getElementById('search').value.toLowerCase();

    let filtered = allIngredients;

    if (search) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(search)
        );
    }

    if (selectedProperties.length > 0) {
        filtered = filtered.filter(item =>
            item.properties && selectedProperties.some(prop => item.properties.includes(prop))
        );
    }

    if (selectedTags.length > 0) {
        filtered = filtered.filter(item =>
            item.tags && selectedTags.some(tag => item.tags.includes(tag))
        );
    }

    renderIngredients(filtered);
}

function renderComposition(composition) {
    return composition.map(item => {
        if (item.startsWith('@')) {
            const name = item.slice(1);
            const ingredients = JSON.parse(localStorage.getItem('potionwiki_ingredients') || '[]');
            const potions = JSON.parse(localStorage.getItem('potionwiki_potions') || '[]');
            const all = potions.concat(ingredients);
            const found = all.find(i => i.name === name);
            if (found) {
                const isIngredient = ingredients.some(i => i.id === found.id);
                const page = isIngredient ? 'ingredients.html' : 'index.html';
                return `<li><a href="${page}?name=${encodeURIComponent(name)}" class="composition-link">${name}</a></li>`;
            }
            return `<li><span class="composition-link missing">${name}</span></li>`;
        }
        return `<li>${item}</li>`;
    }).join('');
}

function openModal(item) {
    const modal = document.getElementById('potionModal');

    document.getElementById('modalImage').src = item.image || '';
    document.getElementById('modalImage').style.display = item.image ? 'block' : 'none';
    document.getElementById('modalName').textContent = item.name;
    document.getElementById('modalDescription').textContent = item.description || '';

    const tagsHtml = item.tags ? item.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
    document.getElementById('modalTags').innerHTML = tagsHtml;

    const propsList = document.getElementById('modalProperties');
    propsList.innerHTML = item.properties ? item.properties.map(p => `<li>${p}</li>`).join('') : '';

    const compList = document.getElementById('modalComposition');
    compList.innerHTML = item.composition ? renderComposition(item.composition) : '';

    document.getElementById('modalAdditional').textContent = item.additionalDescription || '';

    document.getElementById('editPotionBtn').onclick = () => {
        closeModal();
        location.replace(`editor.html?type=ingredient&id=${item.id}`);
    };

    modal.style.display = 'block';
    modal.style.overflowY = 'auto';
}

function closeModal() {
    document.getElementById('potionModal').style.display = 'none';
}

if (document.getElementById('search')) {
    document.getElementById('search').addEventListener('input', filterIngredients);
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
            filterIngredients();
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
            filterIngredients();
        }
    });
}

window.addEventListener('storage', () => {
    loadIngredients();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope);
            })
            .catch((error) => {
                console.error('SW registration failed:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', loadIngredients);
