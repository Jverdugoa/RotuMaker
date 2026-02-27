/**
 * print.js
 * Handles mosaic layout and printing of labels
 */

import { buildLabelHTML } from './label.js';

/**
 * Prepare the print area and trigger window.print()
 * @param {Array} labels - Array of LabelData objects
 * @param {Object} company - Company settings
 * @param {number} perPage - Labels per page (1, 2, 3, 4, or 6)
 * @param {string} orientation - 'portrait' or 'landscape'
 */
export function printLabels(labels, company, perPage = 6, orientation = 'portrait') {
    if (!labels || labels.length === 0) return;

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = '';

    // Set page orientation via dynamic style
    const styleId = 'print-orientation-style';
    let existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
        existingStyle = document.createElement('style');
        existingStyle.id = styleId;
        document.head.appendChild(existingStyle);
    }
    existingStyle.textContent = `@media print { @page { size: letter ${orientation}; margin: 10mm; } }`;

    // Determine grid layout
    const cols = perPage >= 2 ? 2 : 1;

    // Chunk labels into pages
    const pages = chunkArray(labels, perPage);

    pages.forEach((pageLabels, pageIdx) => {
        const page = document.createElement('div');
        page.className = `print-page cols-${cols}`;
        if (pageIdx < pages.length - 1) {
            page.style.pageBreakAfter = 'always';
        }

        pageLabels.forEach(label => {
            const rotulo = document.createElement('div');
            const inkSave = localStorage.getItem('rotumaker_ink_save') === 'true';
            const brandColor = sessionStorage.getItem('rotumaker_brand_color') || '#1a1a2e';

            rotulo.className = `print-rotulo rotulo ${inkSave ? 'ink-save' : ''}`;
            rotulo.style.setProperty('--label-accent', brandColor);
            rotulo.innerHTML = buildLabelHTML(label, company);
            page.appendChild(rotulo);
        });

        printArea.appendChild(page);
    });

    // Small delay to ensure DOM is ready, then print
    setTimeout(() => window.print(), 100);
}

/**
 * Build a visual mini-preview of the mosaic sheet (for the Imprimir tab)
 * @param {Array} labels
 * @param {Object} company
 * @param {number} perPage
 * @param {HTMLElement} container
 */
export function renderPrintPreview(labels, company, perPage, container) {
    container.innerHTML = '';

    if (!labels || labels.length === 0) return;

    const cols = perPage >= 2 ? 2 : 1;
    const pages = chunkArray(labels, perPage);

    pages.forEach(pageLabels => {
        const sheet = document.createElement('div');
        sheet.className = 'print-sheet-mini';
        sheet.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      gap: 6px;
      background: #f0f2f8;
      border: 1px solid #c8cad0;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 12px;
    `;

        pageLabels.forEach(label => {
            const mini = document.createElement('div');
            const inkSave = localStorage.getItem('rotumaker_ink_save') === 'true';
            const brandColor = sessionStorage.getItem('rotumaker_brand_color') || '#1a1a2e';

            mini.className = `rotulo ${inkSave ? 'ink-save' : ''}`;
            mini.style.cssText = `transform-origin: top left; font-size: 0.6rem; pointer-events: none; --label-accent: ${brandColor};`;
            mini.innerHTML = buildLabelHTML(label, company);
            sheet.appendChild(mini);
        });

        container.appendChild(sheet);
    });
}

function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
