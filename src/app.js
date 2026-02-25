/**
 * app.js — RotuMaker main orchestrator
 */

import { extractFromMessage, getExtractorErrorMessage } from './extractor.js';
import { buildLabelHTML, renderLabelPreview } from './label.js';
import { printLabels, renderPrintPreview } from './print.js';
import { getSettings, bindSettingsEvents } from './settings.js';

// ================================
// STATE
// ================================
let labels = [];       // Array of LabelData
let perPage = 6;       // Labels per print page
let orientation = 'portrait';

// ================================
// INIT
// ================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    bindSettingsEvents(onSettingsSaved);
    bindExtractEvents();
    bindLabelTabEvents();
    bindPrintTabEvents();
    updateLabelBadge();
});

// ================================
// NAVIGATION
// ================================
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    document.getElementById(`nav-${tabName}`)?.classList.add('active');

    if (tabName === 'rotulo') refreshLabelPreview();
    if (tabName === 'imprimir') refreshPrintPreview();
}

// ================================
// SETTINGS
// ================================
function onSettingsSaved() {
    showToast('✅ Configuración guardada', 'success');
    refreshLabelPreview();
}

// ================================
// EXTRACT TAB
// ================================
function bindExtractEvents() {
    document.getElementById('btn-clear-msg').addEventListener('click', () => {
        document.getElementById('input-message').value = '';
        document.getElementById('extracted-section').style.display = 'none';
        document.getElementById('input-message').focus();
    });

    document.getElementById('btn-extract').addEventListener('click', handleExtract);

    // Payment type show/hide recaudo amount
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const recaudoDiv = document.getElementById('recaudo-amount');
            recaudoDiv.style.display = radio.value === 'recaudo' && radio.checked ? 'block' : 'none';
            if (radio.value !== 'recaudo') {
                document.getElementById('field-monto').value = '';
            }
        });
    });

    document.getElementById('btn-add-label').addEventListener('click', handleAddLabel);
    document.getElementById('btn-preview-label').addEventListener('click', () => {
        handleAddLabel();
        switchTab('rotulo');
    });
}

async function handleExtract() {
    const rawText = document.getElementById('input-message').value.trim();
    const settings = getSettings();

    const btn = document.getElementById('btn-extract');
    const btnText = document.getElementById('btn-extract-text');

    const currentKey = settings.provider === 'groq' ? settings.groqKey : settings.apiKey;

    // Check API key
    if (!currentKey) {
        showToast(`⚙️ Configura tu API Key de ${settings.provider === 'groq' ? 'Groq' : 'Gemini'} en Ajustes`, 'error');
        document.getElementById('btn-settings').click();
        return;
    }

    if (!rawText) {
        showToast('📝 Pega un mensaje primero', 'error');
        return;
    }

    // Loading state
    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Extrayendo...';

    try {
        const extracted = await extractFromMessage(rawText, currentKey, settings.provider);
        fillExtractedFields(extracted);
        document.getElementById('extracted-section').style.display = 'block';
        document.getElementById('extracted-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('✅ Datos extraídos correctamente', 'success');
    } catch (err) {
        showToast(getExtractorErrorMessage(err), 'error');
        console.error('[RotuMaker] Extract error:', err);
    } finally {
        btn.disabled = false;
        btnText.innerHTML = 'Extraer con IA';
    }
}

function fillExtractedFields(data) {
    document.getElementById('field-nombre').value = data.nombre || '';
    document.getElementById('field-cedula').value = data.cedula || '';
    document.getElementById('field-direccion').value = data.direccion || '';
    document.getElementById('field-ciudad').value = data.ciudad || '';
    document.getElementById('field-telefono').value = data.telefono || '';
}

function getFormData() {
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    return {
        nombre: document.getElementById('field-nombre').value.trim(),
        cedula: document.getElementById('field-cedula').value.trim(),
        direccion: document.getElementById('field-direccion').value.trim(),
        ciudad: document.getElementById('field-ciudad').value.trim(),
        telefono: document.getElementById('field-telefono').value.trim(),
        paymentType: paymentRadio?.value || '',
        monto: document.getElementById('field-monto').value.trim(),
    };
}

function handleAddLabel() {
    const data = getFormData();

    // Must have at least a name or address
    if (!data.nombre && !data.direccion) {
        showToast('⚠️ Agrega al menos nombre o dirección', 'error');
        return;
    }

    if (labels.length >= 6) {
        showToast('⚠️ Máximo 6 rótulos en cola. Imprime o limpia la cola.', 'error');
        return;
    }

    labels.push({ ...data, id: Date.now() });
    updateLabelBadge();
    showToast(`✅ Rótulo ${labels.length} agregado`, 'success');

    // Clear form for next
    clearExtractForm();
}

function clearExtractForm() {
    document.getElementById('input-message').value = '';
    document.getElementById('extracted-section').style.display = 'none';
    ['field-nombre', 'field-cedula', 'field-direccion', 'field-ciudad', 'field-telefono', 'field-monto']
        .forEach(id => document.getElementById(id).value = '');
    document.querySelectorAll('input[name="payment"]').forEach(r => r.checked = false);
    document.getElementById('recaudo-amount').style.display = 'none';
}

// ================================
// LABEL PREVIEW TAB
// ================================
function bindLabelTabEvents() {
    document.getElementById('btn-clear-labels').addEventListener('click', () => {
        labels = [];
        updateLabelBadge();
        refreshLabelPreview();
        showToast('Cola de rótulos limpiada', 'success');
    });

    document.getElementById('btn-go-extract').addEventListener('click', () => switchTab('extraer'));
    document.getElementById('btn-go-print').addEventListener('click', () => switchTab('imprimir'));
}

function refreshLabelPreview() {
    const container = document.getElementById('label-preview-container');
    const emptyState = document.getElementById('label-empty');
    const previewActions = document.getElementById('preview-actions');
    const countText = document.getElementById('label-count-text');

    container.innerHTML = '';

    if (labels.length === 0) {
        emptyState.style.display = 'flex';
        previewActions.style.display = 'none';
        countText.textContent = '0 rótulos en cola';
        return;
    }

    emptyState.style.display = 'none';
    previewActions.style.display = 'flex';
    countText.textContent = `${labels.length} rótulo${labels.length !== 1 ? 's' : ''} en cola`;

    const settings = getSettings();
    const company = {
        companyName: settings.companyName,
        companyAddr: settings.companyAddr,
        companyPhone: settings.companyPhone,
        companyCity: settings.companyCity,
        companyLogo: settings.companyLogo,
    };

    labels.forEach((label, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'label-item-wrap';
        wrapper.dataset.id = label.id;

        const rotulo = document.createElement('div');
        rotulo.className = 'rotulo';
        rotulo.innerHTML = buildLabelHTML(label, company);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'label-delete-btn';
        deleteBtn.title = 'Eliminar rótulo';
        deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
        deleteBtn.addEventListener('click', () => {
            labels = labels.filter(l => l.id !== label.id);
            updateLabelBadge();
            refreshLabelPreview();
            showToast('Rótulo eliminado', 'success');
        });

        wrapper.appendChild(rotulo);
        wrapper.appendChild(deleteBtn);
        container.appendChild(wrapper);
    });
}

// ================================
// PRINT TAB
// ================================
function bindPrintTabEvents() {
    // Mosaic count selector
    document.getElementById('mosaic-selector').addEventListener('click', e => {
        const btn = e.target.closest('.mosaic-btn');
        if (!btn) return;
        document.querySelectorAll('.mosaic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        perPage = parseInt(btn.dataset.count, 10);
        refreshPrintPreview();
    });

    // Orientation
    document.getElementById('orient-portrait').addEventListener('click', () => {
        setOrientation('portrait');
    });
    document.getElementById('orient-landscape').addEventListener('click', () => {
        setOrientation('landscape');
    });

    document.getElementById('btn-print').addEventListener('click', handlePrint);
}

function setOrientation(orient) {
    orientation = orient;
    document.getElementById('orient-portrait').classList.toggle('active', orient === 'portrait');
    document.getElementById('orient-landscape').classList.toggle('active', orient === 'landscape');
    refreshPrintPreview();
}

function refreshPrintPreview() {
    const container = document.getElementById('print-sheet-preview');
    const emptyText = document.getElementById('print-empty-text');

    if (labels.length === 0) {
        emptyText.style.display = 'block';
        container.innerHTML = '';
        return;
    }

    emptyText.style.display = 'none';
    const settings = getSettings();
    const company = {
        companyName: settings.companyName,
        companyAddr: settings.companyAddr,
        companyPhone: settings.companyPhone,
        companyCity: settings.companyCity,
        companyLogo: settings.companyLogo,
    };

    renderPrintPreview(labels, company, perPage, container);
}

function handlePrint() {
    if (labels.length === 0) {
        showToast('⚠️ No hay rótulos en cola', 'error');
        return;
    }
    const settings = getSettings();
    const company = {
        companyName: settings.companyName,
        companyAddr: settings.companyAddr,
        companyPhone: settings.companyPhone,
        companyCity: settings.companyCity,
        companyLogo: settings.companyLogo,
    };
    printLabels(labels, company, perPage, orientation);
}

// ================================
// BADGE
// ================================
function updateLabelBadge() {
    const badge = document.getElementById('nav-badge');
    if (labels.length > 0) {
        badge.textContent = labels.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    // Also update count bar if visible
    const countText = document.getElementById('label-count-text');
    if (countText) {
        countText.textContent = `${labels.length} rótulo${labels.length !== 1 ? 's' : ''} en cola`;
    }
}

// ================================
// TOAST
// ================================
let toastTimer;
export function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
