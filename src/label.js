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
    company.companyName && `<div class="rotulo-field"><strong>Empresa</strong>${company.companyName}</div>`,
    company.companyAddr && `<div class="rotulo-field"><strong>Dirección</strong>${company.companyAddr}</div>`,
    company.companyCity && `<div class="rotulo-field"><strong>Ciudad</strong>${company.companyCity}</div>`,
    company.companyPhone && `<div class="rotulo-field"><strong>Tel</strong>${formatPhone(company.companyPhone)}</div>`,
  ].filter(Boolean).join('');

  if (label.notas) {
    remitente += `<div class="rotulo-h-divider"></div>`;
    remitente += `<div class="rotulo-field"><strong>Notas / Contenido</strong>${label.notas}</div>`;
  }

  const destinatario = [
    label.nombre && `<div class="rotulo-field"><strong>Nombre</strong>${label.nombre}</div>`,
    label.cedula && `<div class="rotulo-field"><strong>Cédula</strong>${formatCedula(label.cedula)}</div>`,
    label.direccion && `<div class="rotulo-field"><strong>Dirección</strong>${label.direccion}</div>`,
    label.ciudad && `<div class="rotulo-field"><strong>Ciudad</strong>${label.ciudad}</div>`,
    label.telefono && `<div class="rotulo-field"><strong>Tel</strong>${formatPhone(label.telefono)}</div>`,
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
      extra = `<span class="rotulo-amount">$${formatMonto(monto)}</span>`;
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
export function renderLabelPreview(label, company, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'label-item-wrap';

  const rotulo = document.createElement('div');
  const inkSave = localStorage.getItem('rotumaker_ink_save') === 'true';
  const brandColor = sessionStorage.getItem('rotumaker_brand_color') || '#1a1a2e';

  rotulo.className = inkSave ? 'rotulo ink-save' : 'rotulo';
  rotulo.style.setProperty('--label-accent', brandColor);
  rotulo.innerHTML = buildLabelHTML(label, company);
  wrapper.appendChild(rotulo);

  container.appendChild(wrapper);
  return wrapper;
}

// ---- Helpers ----

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

function formatCedula(cedula) {
  const digits = String(cedula).replace(/\D/g, '');
  // Format with dots: 1.234.567
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatMonto(monto) {
  const num = parseFloat(String(monto).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return monto;
  return num.toLocaleString('es-CO');
}
