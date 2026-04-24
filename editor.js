const STORAGE_KEY = 'potionwiki_potions';

function generateId(name) {
    return name
        .toLowerCase()
        .replace(/[^а-яёa-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function loadAllPotions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function saveAllPotions(potions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(potions));
}

function populatePotionSelect() {
    const potions = loadAllPotions();
    const select = document.getElementById('existingPotions');
    select.innerHTML = '<option value="">-- Новое зелье --</option>';
    potions.forEach(potion => {
        const option = document.createElement('option');
        option.value = potion.id;
        option.textContent = potion.name;
        select.appendChild(option);
    });
}

let currentEditingId = null;

function loadPotionById(id) {
    const potions = loadAllPotions();
    const potion = potions.find(p => p.id === id);
    if (potion) {
        currentEditingId = potion.id;
        fillForm(potion);
    }
}

function fillForm(potion) {
    document.getElementById('potionName').value = potion.name || '';
    document.getElementById('potionDescription').value = potion.description || '';
    document.getElementById('potionAdditional').value = potion.additionalDescription || '';
    document.getElementById('potionImage').value = potion.image || '';
    document.getElementById('potionTags').value = potion.tags ? potion.tags.join(', ') : '';
    document.getElementById('potionHabitat').value = potion.habitat ? potion.habitat.join(', ') : '';
    document.getElementById('potionProperties').value = potion.properties ? potion.properties.join('\n') : '';
    document.getElementById('potionIngredients').value = potion.ingredients ? potion.ingredients.join('\n') : '';
    currentEditingId = potion.id;
}

function getFormData() {
    const tagsInput = document.getElementById('potionTags').value;
    const habitatInput = document.getElementById('potionHabitat').value;
    const propertiesInput = document.getElementById('potionProperties').value;
    const ingredientsInput = document.getElementById('potionIngredients').value;

    return {
        name: document.getElementById('potionName').value.trim(),
        description: document.getElementById('potionDescription').value.trim(),
        additionalDescription: document.getElementById('potionAdditional').value.trim(),
        image: document.getElementById('potionImage').value.trim(),
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [],
        habitat: habitatInput ? habitatInput.split(',').map(h => h.trim()).filter(h => h) : [],
        properties: propertiesInput ? propertiesInput.split('\n').map(p => p.trim()).filter(p => p) : [],
        ingredients: ingredientsInput ? ingredientsInput.split('\n').map(i => i.trim()).filter(i => i) : []
    };
}

function savePotion() {
    const formData = getFormData();

    if (!formData.name) {
        alert('Название обязательно');
        return;
    }

    const potions = loadAllPotions();
    const id = currentEditingId || generateId(formData.name);

    if (!id) {
        alert('Невозможно сгенерировать ID');
        return;
    }

    const existingIndex = potions.findIndex(p => p.id === id);

    const potion = {
        id: id,
        ...formData
    };

    if (existingIndex >= 0) {
        potions[existingIndex] = potion;
    } else {
        potions.push(potion);
    }

    saveAllPotions(potions);
    currentEditingId = id;
    populatePotionSelect();
    document.getElementById('existingPotions').value = id;

    alert('Зелье сохранено!');
}

function clearForm() {
    document.getElementById('potionName').value = '';
    document.getElementById('potionDescription').value = '';
    document.getElementById('potionAdditional').value = '';
    document.getElementById('potionImage').value = '';
    document.getElementById('potionTags').value = '';
    document.getElementById('potionHabitat').value = '';
    document.getElementById('potionProperties').value = '';
    document.getElementById('potionIngredients').value = '';
    document.getElementById('existingPotions').value = '';
    currentEditingId = null;
}

function deletePotion() {
    const select = document.getElementById('existingPotions');
    const id = select.value;

    if (!id) {
        const formData = getFormData();
        if (!formData.name || !confirm(`Удалить зелье "${formData.name}"?`)) return;
        const potionId = generateId(formData.name);
        let potions = loadAllPotions();
        const filtered = potions.filter(p => p.id !== potionId);
        saveAllPotions(filtered);
        clearForm();
        populatePotionSelect();
        return;
    }

    if (!confirm(`Удалить зелье "${id}"?`)) return;

    let potions = loadAllPotions();
    const filtered = potions.filter(p => p.id !== id);
    saveAllPotions(filtered);
    clearForm();
    populatePotionSelect();
}

function exportAllData() {
    const potions = loadAllPotions();
    const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        potions: potions
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
            if (!data.potions || !Array.isArray(data.potions)) {
                alert('Неверный формат файла');
                return;
            }

            const count = data.potions.length;
            if (!confirm(`Импортировать ${count} зелий? Существующие данные будут заменены.`)) return;

            saveAllPotions(data.potions);
            clearForm();
            populatePotionSelect();
            alert(`Импортировано ${count} зелий!`);
        } catch (error) {
            alert('Ошибка чтения файла');
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

function deleteAllData() {
    const count = loadAllPotions().length;
    if (count === 0) {
        alert('Нет данных для удаления');
        return;
    }

    if (!confirm(`Удалить ВСЕ данные (${count} зелий)? Это действие нельзя отменить!`)) return;
    if (!confirm('ВЫ УВЕРЕНЫ? Все данные будут потеряны навсегда!')) return;

    localStorage.removeItem(STORAGE_KEY);
    clearForm();
    populatePotionSelect();
    alert('Все данные удалены');
}

document.addEventListener('DOMContentLoaded', () => {
    populatePotionSelect();

    const params = new URLSearchParams(window.location.search);
    const potionId = params.get('id');
    if (potionId) {
        loadPotionById(potionId);
        document.getElementById('existingPotions').value = potionId;
    }
});

document.getElementById('savePotionBtn').addEventListener('click', savePotion);
document.getElementById('deletePotionBtn').addEventListener('click', deletePotion);
document.getElementById('exportAllBtn').addEventListener('click', exportAllData);
document.getElementById('importAllBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});
document.getElementById('importFileInput').addEventListener('change', importAllData);
document.getElementById('deleteAllBtn').addEventListener('click', deleteAllData);
document.getElementById('clearBtn').addEventListener('click', clearForm);
document.getElementById('existingPotions').addEventListener('change', (e) => {
    if (e.target.value) {
        loadPotionById(e.target.value);
    } else {
        clearForm();
    }
});