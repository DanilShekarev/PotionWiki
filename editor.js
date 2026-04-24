const STORAGE_KEY = 'potionwiki_potions';
const IMAGE_STORAGE_PREFIX = 'potionwiki_image_';

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

function loadImage(id) {
    return localStorage.getItem(IMAGE_STORAGE_PREFIX + id);
}

function saveImage(id, dataUrl) {
    if (dataUrl) {
        localStorage.setItem(IMAGE_STORAGE_PREFIX + id, dataUrl);
    } else {
        localStorage.removeItem(IMAGE_STORAGE_PREFIX + id);
    }
}

function deleteImage(id) {
    localStorage.removeItem(IMAGE_STORAGE_PREFIX + id);
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
let hasUnsavedImage = false;

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
    document.getElementById('potionTags').value = potion.tags ? potion.tags.join(', ') : '';
    document.getElementById('potionProperties').value = potion.properties ? potion.properties.join('\n') : '';
    document.getElementById('potionIngredients').value = potion.ingredients ? potion.ingredients.join('\n') : '';

    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');
    const removeBtn = document.getElementById('removeImageBtn');

    const storedImage = loadImage(potion.id);
    if (storedImage) {
        preview.src = storedImage;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'inline-block';
        currentEditingId = potion.id;
        hasUnsavedImage = false;
    } else {
        preview.style.display = 'none';
        placeholder.style.display = 'block';
        removeBtn.style.display = 'none';
        currentEditingId = potion.id;
        hasUnsavedImage = false;
    }
}

function getFormData() {
    const tagsInput = document.getElementById('potionTags').value;
    const propertiesInput = document.getElementById('potionProperties').value;
    const ingredientsInput = document.getElementById('potionIngredients').value;

    return {
        name: document.getElementById('potionName').value.trim(),
        description: document.getElementById('potionDescription').value.trim(),
        additionalDescription: document.getElementById('potionAdditional').value.trim(),
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [],
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

    if (hasUnsavedImage) {
        const preview = document.getElementById('imagePreview');
        if (preview.style.display !== 'none') {
            saveImage(id, preview.src);
        }
    } else {
        const preview = document.getElementById('imagePreview');
        if (preview.style.display === 'none') {
            deleteImage(currentEditingId || id);
        }
    }

    currentEditingId = id;
    hasUnsavedImage = false;
    populatePotionSelect();
    document.getElementById('existingPotions').value = id;

    alert('Зелье сохранено!');
}

function handleImageUpload(file) {
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
        alert('Допускаются только PNG, JPG и WebP изображения');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        const removeBtn = document.getElementById('removeImageBtn');

        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'inline-block';
        hasUnsavedImage = true;
    };
    reader.readAsDataURL(file);
}

function downloadJson() {
    const formData = getFormData();

    if (!formData.name) {
        alert('Название обязательно');
        return;
    }

    const id = generateId(formData.name);
    const potion = {
        id: id,
        ...formData
    };

    const json = JSON.stringify(potion, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.json`;
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
            currentEditingId = potion.id;
            fillForm(potion);
        } catch (error) {
            alert('Ошибка чтения JSON');
        }
    };
    reader.readAsText(file);

    event.target.value = '';
}

function clearForm() {
    document.getElementById('potionName').value = '';
    document.getElementById('potionDescription').value = '';
    document.getElementById('potionAdditional').value = '';
    document.getElementById('potionTags').value = '';
    document.getElementById('potionProperties').value = '';
    document.getElementById('potionIngredients').value = '';
    document.getElementById('existingPotions').value = '';

    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imagePlaceholder').style.display = 'block';
    document.getElementById('removeImageBtn').style.display = 'none';

    currentEditingId = null;
    hasUnsavedImage = false;
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
        deleteImage(potionId);
        clearForm();
        populatePotionSelect();
        return;
    }

    if (!confirm(`Удалить зелье "${id}"?`)) return;

    let potions = loadAllPotions();
    const filtered = potions.filter(p => p.id !== id);
    saveAllPotions(filtered);
    deleteImage(id);
    clearForm();
    populatePotionSelect();
}

document.addEventListener('DOMContentLoaded', () => {
    populatePotionSelect();

    const params = new URLSearchParams(window.location.search);
    const potionId = params.get('id');
    if (potionId) {
        loadPotionById(potionId);
        document.getElementById('existingPotions').value = potionId;
    }

    const uploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('potionImageInput');

    uploadArea.addEventListener('click', () => imageInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleImageUpload(file);
    });

    imageInput.addEventListener('change', (e) => {
        handleImageUpload(e.target.files[0]);
    });

    document.getElementById('removeImageBtn').addEventListener('click', () => {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        const removeBtn = document.getElementById('removeImageBtn');

        preview.style.display = 'none';
        preview.src = '';
        placeholder.style.display = 'block';
        removeBtn.style.display = 'none';
        hasUnsavedImage = true;
        imageInput.value = '';
    });
});

document.getElementById('savePotionBtn').addEventListener('click', savePotion);
document.getElementById('deletePotionBtn').addEventListener('click', deletePotion);
document.getElementById('downloadJsonBtn').addEventListener('click', downloadJson);
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