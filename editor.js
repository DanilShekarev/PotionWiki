const POTIONS_DIR = 'potions/';

let loadedPotion = {
    id: '',
    name: '',
    description: '',
    additionalDescription: '',
    image: '',
    tags: [],
    properties: [],
    ingredients: []
};

let allPotions = [];

async function loadExistingPotions() {
    try {
        const response = await fetch(POTIONS_DIR + 'index.json');
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        allPotions = data.potions || [];
        populatePotionSelect();
    } catch (error) {
        console.error('Error:', error);
    }
}

function populatePotionSelect() {
    const select = document.getElementById('existingPotions');
    select.innerHTML = '<option value="">-- Новое зелье --</option>';
    allPotions.forEach(potion => {
        const option = document.createElement('option');
        option.value = potion.id;
        option.textContent = potion.name;
        select.appendChild(option);
    });
}

function loadPotionById(id) {
    const potion = allPotions.find(p => p.id === id);
    if (potion) {
        fillForm(potion);
    }
}

function fillForm(potion) {
    document.getElementById('potionId').value = potion.id || '';
    document.getElementById('potionName').value = potion.name || '';
    document.getElementById('potionDescription').value = potion.description || '';
    document.getElementById('potionAdditional').value = potion.additionalDescription || '';
    document.getElementById('potionImage').value = potion.image || '';
    document.getElementById('potionTags').value = potion.tags ? potion.tags.join(', ') : '';
    document.getElementById('potionProperties').value = potion.properties ? potion.properties.join('\n') : '';
    document.getElementById('potionIngredients').value = potion.ingredients ? potion.ingredients.join('\n') : '';
}

function getFormData() {
    const tagsInput = document.getElementById('potionTags').value;
    const propertiesInput = document.getElementById('potionProperties').value;
    const ingredientsInput = document.getElementById('potionIngredients').value;

    return {
        id: document.getElementById('potionId').value.trim(),
        name: document.getElementById('potionName').value.trim(),
        description: document.getElementById('potionDescription').value.trim(),
        additionalDescription: document.getElementById('potionAdditional').value.trim(),
        image: document.getElementById('potionImage').value.trim(),
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [],
        properties: propertiesInput ? propertiesInput.split('\n').map(p => p.trim()).filter(p => p) : [],
        ingredients: ingredientsInput ? ingredientsInput.split('\n').map(i => i.trim()).filter(i => i) : []
    };
}

function downloadJson() {
    const potion = getFormData();

    if (!potion.id || !potion.name) {
        alert('ID и название обязательны');
        return;
    }

    const json = JSON.stringify(potion, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${potion.id}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

function uploadJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const potion = JSON.parse(e.target.result);
            fillForm(potion);
        } catch (error) {
            alert('Ошибка чтения JSON');
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

function clearForm() {
    document.getElementById('potionId').value = '';
    document.getElementById('potionName').value = '';
    document.getElementById('potionDescription').value = '';
    document.getElementById('potionAdditional').value = '';
    document.getElementById('potionImage').value = '';
    document.getElementById('potionTags').value = '';
    document.getElementById('potionProperties').value = '';
    document.getElementById('potionIngredients').value = '';
    document.getElementById('existingPotions').value = '';
}

document.getElementById('saveJsonBtn').addEventListener('click', downloadJson);
document.getElementById('loadJsonBtn').addEventListener('click', () => {
    document.getElementById('jsonFileInput').click();
});
document.getElementById('jsonFileInput').addEventListener('change', uploadJson);
document.getElementById('clearBtn').addEventListener('click', clearForm);
document.getElementById('existingPotions').addEventListener('change', (e) => {
    if (e.target.value) {
        loadPotionById(e.target.value);
    } else {
        clearForm();
    }
});

document.addEventListener('DOMContentLoaded', loadExistingPotions);