const STORAGE_KEY_POTIONS = 'potionwiki_potions';
const STORAGE_KEY_INGREDIENTS = 'potionwiki_ingredients';

let currentType = 'potion';
let currentEditingId = null;

function generateId(name) {
    return name
        .toLowerCase()
        .replace(/[^а-яёa-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function getStorageKey() {
    return currentType === 'potion' ? STORAGE_KEY_POTIONS : STORAGE_KEY_INGREDIENTS;
}

function loadAll() {
    const stored = localStorage.getItem(getStorageKey());
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveAll(items) {
    localStorage.setItem(getStorageKey(), JSON.stringify(items));
}

function loadAllPotions() {
    const stored = localStorage.getItem(STORAGE_KEY_POTIONS);
    return stored ? JSON.parse(stored) : [];
}

function loadAllIngredients() {
    const stored = localStorage.getItem(STORAGE_KEY_INGREDIENTS);
    return stored ? JSON.parse(stored) : [];
}

function getAllItems() {
    return loadAllPotions().concat(loadAllIngredients());
}

function populateSelect() {
    const items = loadAll();
    const select = document.getElementById('existingPotions');
    select.innerHTML = '<option value="">-- Новое --</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });
}

function setType(type) {
    currentType = type;
    currentEditingId = null;

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    const habitatGroup = document.getElementById('habitatGroup');
    if (habitatGroup) {
        habitatGroup.style.display = type === 'ingredient' ? 'block' : 'none';
    }

    clearForm();
    populateSelect();
}

function loadById(id) {
    const items = loadAll();
    const item = items.find(p => p.id === id);
    if (item) {
        currentEditingId = item.id;
        fillForm(item);
    }
}

function fillForm(item) {
    document.getElementById('potionName').value = item.name || '';
    document.getElementById('potionDescription').value = item.description || '';
    document.getElementById('potionAdditional').value = item.additionalDescription || '';
    document.getElementById('potionImage').value = item.image || '';
    document.getElementById('potionTags').value = item.tags ? item.tags.join(', ') : '';
    document.getElementById('potionProperties').value = item.properties ? item.properties.join('\n') : '';
    document.getElementById('potionComposition').value = item.composition ? item.composition.join('\n') : '';
    const habitatInput = document.getElementById('potionHabitat');
    if (habitatInput) {
        habitatInput.value = item.habitat ? item.habitat.join(', ') : '';
    }
    currentEditingId = item.id;
}

function getFormData() {
    const tagsInput = document.getElementById('potionTags').value;
    const propertiesInput = document.getElementById('potionProperties').value;
    const compositionInput = document.getElementById('potionComposition').value;
    const habitatInput = document.getElementById('potionHabitat') ? document.getElementById('potionHabitat').value : '';

    const data = {
        name: document.getElementById('potionName').value.trim(),
        description: document.getElementById('potionDescription').value.trim(),
        additionalDescription: document.getElementById('potionAdditional').value.trim(),
        image: document.getElementById('potionImage').value.trim(),
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [],
        properties: propertiesInput ? propertiesInput.split('\n').map(p => p.trim()).filter(p => p) : [],
        composition: compositionInput ? compositionInput.split('\n').map(c => c.trim()).filter(c => c) : []
    };

    if (currentType === 'ingredient' && habitatInput) {
        data.habitat = habitatInput.split(',').map(h => h.trim()).filter(h => h);
    }

    return data;
}

function saveItem() {
    const formData = getFormData();

    if (!formData.name) {
        alert('Название обязательно');
        return;
    }

    const items = loadAll();
    const id = currentEditingId || generateId(formData.name);

    if (!id) {
        alert('Невозможно сгенерировать ID');
        return;
    }

    const existingIndex = items.findIndex(p => p.id === id);

    const item = {
        id: id,
        ...formData
    };

    if (existingIndex >= 0) {
        items[existingIndex] = item;
    } else {
        items.push(item);
    }

    saveAll(items);
    currentEditingId = id;
    populateSelect();
    document.getElementById('existingPotions').value = id;

    const label = currentType === 'potion' ? 'Зелье' : 'Ингредиент';
    alert(`${label} сохранён!`);
}

function clearForm() {
    document.getElementById('potionName').value = '';
    document.getElementById('potionDescription').value = '';
    document.getElementById('potionAdditional').value = '';
    document.getElementById('potionImage').value = '';
    document.getElementById('potionTags').value = '';
    document.getElementById('potionProperties').value = '';
    document.getElementById('potionComposition').value = '';
    const habitatInput = document.getElementById('potionHabitat');
    if (habitatInput) habitatInput.value = '';
    document.getElementById('existingPotions').value = '';
    currentEditingId = null;
    hideAutocomplete();
}

function deleteItem() {
    const select = document.getElementById('existingPotions');
    const id = select.value;
    const label = currentType === 'potion' ? 'зелье' : 'ингредиент';

    if (!id) {
        const formData = getFormData();
        if (!formData.name || !confirm(`Удалить ${label} "${formData.name}"?`)) return;
        const itemId = generateId(formData.name);
        let items = loadAll();
        const filtered = items.filter(p => p.id !== itemId);
        saveAll(filtered);
        clearForm();
        populateSelect();
        return;
    }

    if (!confirm(`Удалить ${label} "${id}"?`)) return;

    let items = loadAll();
    const filtered = items.filter(p => p.id !== id);
    saveAll(filtered);
    clearForm();
    populateSelect();
}

function exportAllData() {
    const potions = loadAllPotions();
    const ingredients = loadAllIngredients();
    const data = {
        version: 2,
        exportDate: new Date().toISOString(),
        potions: potions,
        ingredients: ingredients
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `potionwiki-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.version === 2 && data.potions && data.ingredients) {
                const potionCount = data.potions.length;
                const ingredientCount = data.ingredients.length;
                if (!confirm(`Импортировать ${potionCount} зелий и ${ingredientCount} ингредиентов? Существующие данные будут заменены.`)) return;

                saveAllPotions(data.potions);
                saveAllIngredients(data.ingredients);
                clearForm();
                populateSelect();
                alert(`Импортировано ${potionCount} зелий и ${ingredientCount} ингредиентов!`);
            } else if (data.potions && Array.isArray(data.potions)) {
                const count = data.potions.length;
                if (!confirm(`Импортировать ${count} зелий (формат v1)? Существующие данные будут заменены.`)) return;

                saveAllPotions(data.potions);
                clearForm();
                populateSelect();
                alert(`Импортировано ${count} зелий!`);
            } else {
                alert('Неверный формат файла');
                return;
            }
        } catch (error) {
            alert('Ошибка чтения файла');
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

function deleteAllData() {
    const potionCount = loadAllPotions().length;
    const ingredientCount = loadAllIngredients().length;
    const total = potionCount + ingredientCount;

    if (total === 0) {
        alert('Нет данных для удаления');
        return;
    }

    if (!confirm(`Удалить ВСЕ данные (${potionCount} зелий, ${ingredientCount} ингредиентов)? Это действие нельзя отменить!`)) return;
    if (!confirm('ВЫ УВЕРЕНЫ? Все данные будут потеряны навсегда!')) return;

    localStorage.removeItem(STORAGE_KEY_POTIONS);
    localStorage.removeItem(STORAGE_KEY_INGREDIENTS);
    clearForm();
    populateSelect();
    alert('Все данные удалены');
}

function saveAllPotions(potions) {
    localStorage.setItem(STORAGE_KEY_POTIONS, JSON.stringify(potions));
}

function saveAllIngredients(ingredients) {
    localStorage.setItem(STORAGE_KEY_INGREDIENTS, JSON.stringify(ingredients));
}

// Autocomplete for @name in composition field
let autocompleteVisible = false;

function showAutocomplete(items, rect) {
    const dropdown = document.getElementById('compositionAutocomplete');
    if (!dropdown || items.length === 0) {
        hideAutocomplete();
        return;
    }

    dropdown.innerHTML = items.map(item => {
        const isIngredient = loadAllIngredients().some(i => i.id === item.id);
        const icon = isIngredient ? '🌿' : '🧪';
        return `<div class="autocomplete-item" data-name="${item.name}">${icon} ${item.name}</div>`;
    }).join('');

    dropdown.style.display = 'block';
    dropdown.style.position = 'absolute';
    dropdown.style.left = '0';
    dropdown.style.right = '0';
    autocompleteVisible = true;

    dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            insertAutocompleteItem(el.dataset.name);
        });
    });
}

function hideAutocomplete() {
    const dropdown = document.getElementById('compositionAutocomplete');
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }
    autocompleteVisible = false;
}

function insertAutocompleteItem(name) {
    const textarea = document.getElementById('potionComposition');
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    const beforeCursor = text.slice(0, cursorPos);
    const afterCursor = text.slice(cursorPos);

    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) {
        hideAutocomplete();
        return;
    }

    const before = text.slice(0, atIndex);
    const lineEnd = beforeCursor.includes('\n') ? beforeCursor.lastIndexOf('\n') + 1 : 0;
    const prefix = beforeCursor.slice(lineEnd);

    textarea.value = before + '@' + name + '\n' + afterCursor;
    textarea.selectionStart = textarea.selectionEnd = (before + '@' + name + '\n').length;

    hideAutocomplete();
    textarea.focus();
}

function handleCompositionInput(e) {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    const beforeCursor = text.slice(0, cursorPos);
    const lastAt = beforeCursor.lastIndexOf('@');

    if (lastAt === -1 || (lastAt > 0 && beforeCursor[lastAt - 1] !== '\n' && beforeCursor[lastAt - 1] !== undefined)) {
        hideAutocomplete();
        return;
    }

    const query = beforeCursor.slice(lastAt + 1).toLowerCase();
    if (query.includes('\n')) {
        hideAutocomplete();
        return;
    }

    const allItems = getAllItems();
    const matches = allItems.filter(item =>
        item.name.toLowerCase().includes(query)
    ).slice(0, 8);

    if (matches.length > 0 && query.length >= 0) {
        showAutocomplete(matches);
    } else {
        hideAutocomplete();
    }
}

function handleCompositionKeydown(e) {
    if (!autocompleteVisible) return;

    const dropdown = document.getElementById('compositionAutocomplete');
    const items = dropdown.querySelectorAll('.autocomplete-item');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const focused = dropdown.querySelector('.focused');
        if (focused) {
            focused.classList.remove('focused');
            const next = focused.nextElementSibling;
            if (next) next.classList.add('focused');
        } else if (items.length > 0) {
            items[0].classList.add('focused');
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const focused = dropdown.querySelector('.focused');
        if (focused) {
            focused.classList.remove('focused');
            const prev = focused.previousElementSibling;
            if (prev) prev.classList.add('focused');
        }
    } else if (e.key === 'Enter' && autocompleteVisible) {
        const focused = dropdown.querySelector('.focused');
        if (focused) {
            e.preventDefault();
            insertAutocompleteItem(focused.dataset.name);
        }
    } else if (e.key === 'Escape') {
        hideAutocomplete();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    populateSelect();

    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const itemId = params.get('id');

    if (type === 'ingredient') {
        setType('ingredient');
    }

    if (itemId) {
        loadById(itemId);
        document.getElementById('existingPotions').value = itemId;
    }

    const compositionTextarea = document.getElementById('potionComposition');
    if (compositionTextarea) {
        compositionTextarea.addEventListener('input', handleCompositionInput);
        compositionTextarea.addEventListener('keydown', handleCompositionKeydown);
        compositionTextarea.addEventListener('blur', () => {
            setTimeout(hideAutocomplete, 200);
        });
    }

    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setType(btn.dataset.type);
        });
    });
});

document.getElementById('savePotionBtn').addEventListener('click', saveItem);
document.getElementById('deletePotionBtn').addEventListener('click', deleteItem);
document.getElementById('exportAllBtn').addEventListener('click', exportAllData);
document.getElementById('importAllBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});
document.getElementById('importFileInput').addEventListener('change', importAllData);
document.getElementById('deleteAllBtn').addEventListener('click', deleteAllData);
document.getElementById('clearBtn').addEventListener('click', clearForm);
document.getElementById('existingPotions').addEventListener('change', (e) => {
    if (e.target.value) {
        loadById(e.target.value);
    } else {
        clearForm();
    }
});
