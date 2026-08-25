/**
 * label.js
 * Generates and renders the rótulo (label) HTML
 */

/**
 * @typedef {Object} LabelData
 * @property {string} nombre
 * @property {string} cedula
 * @property {string} direccion
 * @property {string} ciudad
 * @property {string} telefono
 * @property {'pago'|'recaudo'|'contraentrega'|''} paymentType
 * @property {string} monto  - amount for recaudo
 */

/**
 * @typedef {Object} CompanyData
 * @property {string} companyName
 * @property {string} companyAddr
 * @property {string} companyPhone
 * @property {string} companyCity
 * @property {string} companyLogo  - base64 data URL
 */

/**
 * Build the inner HTML for a single rótulo
 * @param {LabelData} label
 * @param {CompanyData} company
 * @returns {string} HTML string
 */
export function buildLabelHTML(label, company) {
  const brandColor = sessionStorage.getItem('rotumaker_brand_color') || '#1a1a2e';

  const logoHtml = company.companyLogo
    ? `<img class="rotulo-logo" src="${company.companyLogo}" alt="Logo" />`
    : `<div class="rotulo-logo-placeholder">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,0.5)"/>
          <path d="m21 15-5-5L5 21" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>`;

  const watermarkHtml = company.companyLogo
    ? `<div class="label-watermark"><img src="${company.companyLogo}" alt="Watermark" /></div>`
    : '';

  const companyNameDisplay = company.companyName || 'MI EMPRESA';

  let remitente = [
    company.companyName && `<div class="rotulo-field"><strong>Empresa</strong>${escapeHtml(company.companyName)}</div>`,
    company.companyAddr && `<div class="rotulo-field"><strong>Dirección</strong>${escapeHtml(company.companyAddr)}</div>`,
    company.companyCity && `<div class="rotulo-field"><strong>Ciudad</strong>${escapeHtml(company.companyCity)}</div>`,
    company.companyPhone && `<div class="rotulo-field"><strong>Tel</strong>${escapeHtml(formatPhone(company.companyPhone))}</div>`,
  ].filter(Boolean).join('');

  if (label.notas) {
    remitente += `<div class="rotulo-h-divider"></div>`;
    remitente += `<div class="rotulo-field"><strong>Notas / Contenido</strong>${escapeHtml(label.notas)}</div>`;
  }

  const destinatario = [
    label.nombre && `<div class="rotulo-field"><strong>Nombre</strong>${escapeHtml(label.nombre)}</div>`,
    label.cedula && `<div class="rotulo-field"><strong>Cédula</strong>${escapeHtml(formatCedula(label.cedula))}</div>`,
    label.direccion && `<div class="rotulo-field"><strong>Dirección</strong>${escapeHtml(label.direccion)}</div>`,
    label.ciudad && `<div class="rotulo-field"><strong>Ciudad</strong>${escapeHtml(label.ciudad)}</div>`,
    label.telefono && `<div class="rotulo-field"><strong>Tel</strong>${escapeHtml(formatPhone(label.telefono))}</div>`,
  ].filter(Boolean).join('');

  const footerHTML = buildFooterHTML(label.paymentType, label.monto);

  // Note: The root .rotulo div is created outside this function 
  // or we can inject styles here.
  return `
      ${watermarkHtml}
      <div class="rotulo-header">
        ${logoHtml}
        <div class="rotulo-company-name">${escapeHtml(companyNameDisplay)}</div>
      </div>
      <div class="rotulo-body">
        <div class="rotulo-section">
          <div class="rotulo-section-title">Remitente</div>
          ${remitente || '<div class="rotulo-field" style="color:#999;font-size:0.75rem">Configura tu empresa en Ajustes ⚙️</div>'}
        </div>
        <div class="rotulo-divider"></div>
        <div class="rotulo-section">
          <div class="rotulo-section-title">Destinatario</div>
          ${destinatario || '<div class="rotulo-field" style="color:#999;font-size:0.75rem">Sin datos</div>'}
        </div>
      </div>
      <div class="rotulo-footer">
        ${footerHTML}
      </div>
  `;
}


function buildFooterHTML(paymentType, monto) {
  const types = [
    { value: 'pago', label: 'Pago' },
    { value: 'recaudo', label: 'Recaudo' },
    { value: 'contraentrega', label: 'Contraentrega' },
  ];

  return types.map(t => {
    const checked = paymentType === t.value;
    const checkedClass = checked ? 'checked' : '';
    let extra = '';
    if (t.value === 'recaudo' && checked && monto) {
      extra = `<span class="rotulo-amount">$${escapeHtml(formatMonto(monto))}</span>`;
    }
    return `
      <div class="rotulo-check-item">
        <div class="rotulo-checkbox ${checkedClass}"></div>
        <span>${t.label}</span>${extra}
      </div>
    `;
  }).join('');
}

/** Render a label into the preview container */
export function renderLabelPreview(label, company, container, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'label-item-wrap';

  const rotulo = document.createElement('div');
  const inkSave = localStorage.getItem('rotumaker_ink_save') === 'true';
  const brandColor = sessionStorage.getItem('rotumaker_brand_color') || '#1a1a2e';

  rotulo.className = inkSave ? 'rotulo ink-save' : 'rotulo';
  rotulo.style.setProperty('--label-accent', brandColor);
  rotulo.innerHTML = buildLabelHTML(label, company);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'label-actions';
  actions.innerHTML = `
    <button class="btn-action edit" data-index="${index}" title="Editar">
      <svg viewBox="0 0 24 24" fill="none" width="20"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <button class="btn-action delete" data-index="${index}" title="Eliminar">
      <svg viewBox="0 0 24 24" fill="none" width="20"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  `;

  wrapper.appendChild(rotulo);
  wrapper.appendChild(actions);

  container.appendChild(wrapper);
  return wrapper;
}

// ---- Helpers ----

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith('57')) {
    return `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return String(phone).trim();
}

function formatCedula(cedula) {
  if (!cedula) return '';
  const raw = String(cedula).trim();
  // If purely digits, format with dots: 1.234.567
  if (/^\d+$/.test(raw)) {
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  // If Colombian NIT format (e.g. 900123456-1)
  const nitMatch = raw.match(/^(\d+)[-\s](\d)$/);
  if (nitMatch) {
    const body = nitMatch[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${body}-${nitMatch[2]}`;
  }
  return raw;
}

function formatMonto(monto) {
  const num = parseFloat(String(monto).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return monto;
  return num.toLocaleString('es-CO');
}
