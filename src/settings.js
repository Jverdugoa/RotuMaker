/**
 * settings.js
 * Manages app configuration persisted in localStorage
 */

const KEYS = {
    API_KEY_GEMINI: 'rotumaker_api_key',
    API_KEY_GROQ: 'rotumaker_groq_key',
    PROVIDER: 'rotumaker_provider',
    COMPANY_NAME: 'rotumaker_company_name',
    COMPANY_ADDR: 'rotumaker_company_address',
    COMPANY_PHONE: 'rotumaker_company_phone',
    COMPANY_CITY: 'rotumaker_company_city',
    COMPANY_LOGO: 'rotumaker_company_logo',
};

export function getSettings() {
    return {
        apiKey: localStorage.getItem(KEYS.API_KEY_GEMINI) || '',
        groqKey: localStorage.getItem(KEYS.API_KEY_GROQ) || '',
        provider: localStorage.getItem(KEYS.PROVIDER) || 'groq',
        companyName: localStorage.getItem(KEYS.COMPANY_NAME) || '',
        companyAddr: localStorage.getItem(KEYS.COMPANY_ADDR) || '',
        companyPhone: localStorage.getItem(KEYS.COMPANY_PHONE) || '',
        companyCity: localStorage.getItem(KEYS.COMPANY_CITY) || '',
        companyLogo: localStorage.getItem(KEYS.COMPANY_LOGO) || '',
    };
}

export function saveSettings(s) {
    if (s.apiKey !== undefined) localStorage.setItem(KEYS.API_KEY_GEMINI, s.apiKey);
    if (s.groqKey !== undefined) localStorage.setItem(KEYS.API_KEY_GROQ, s.groqKey);
    if (s.provider !== undefined) localStorage.setItem(KEYS.PROVIDER, s.provider);
    if (s.companyName !== undefined) localStorage.setItem(KEYS.COMPANY_NAME, s.companyName);
    if (s.companyAddr !== undefined) localStorage.setItem(KEYS.COMPANY_ADDR, s.companyAddr);
    if (s.companyPhone !== undefined) localStorage.setItem(KEYS.COMPANY_PHONE, s.companyPhone);
    if (s.companyCity !== undefined) localStorage.setItem(KEYS.COMPANY_CITY, s.companyCity);
    if (s.companyLogo !== undefined) localStorage.setItem(KEYS.COMPANY_LOGO, s.companyLogo);
}

export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function initSettingsUI() {
    const s = getSettings();
    document.getElementById('setting-api-key').value = s.apiKey;
    document.getElementById('setting-groq-key').value = s.groqKey;
    document.getElementById('setting-company-name').value = s.companyName;
    document.getElementById('setting-company-address').value = s.companyAddr;
    document.getElementById('setting-company-phone').value = s.companyPhone;
    document.getElementById('setting-company-city').value = s.companyCity;

    // Provider selector
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.provider === s.provider);
    });
    updateProviderFields(s.provider);

    const logoPreview = document.getElementById('logo-preview');
    if (s.companyLogo) {
        logoPreview.innerHTML = `<img src="${s.companyLogo}" alt="Logo" />`;
    }
}

function updateProviderFields(provider) {
    document.getElementById('gemini-key-group').style.display = provider === 'gemini' ? 'flex' : 'none';
    document.getElementById('groq-key-group').style.display = provider === 'groq' ? 'flex' : 'none';
}

export function bindSettingsEvents(onSave) {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('btn-settings');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveBtn = document.getElementById('btn-save-settings');
    const logoBtn = document.getElementById('btn-upload-logo');
    const logoInput = document.getElementById('input-logo');

    // Toggle password visibility (Gemini)
    document.getElementById('toggle-api-key')?.addEventListener('click', () => {
        const inp = document.getElementById('setting-api-key');
        inp.type = inp.type === 'password' ? 'text' : 'password';
    });
    // Toggle password visibility (Groq)
    document.getElementById('toggle-groq-key')?.addEventListener('click', () => {
        const inp = document.getElementById('setting-groq-key');
        inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // Provider selector
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateProviderFields(btn.dataset.provider);
        });
    });

    openBtn.addEventListener('click', () => { initSettingsUI(); modal.classList.add('open'); });
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

    // Logo upload
    logoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const dataUrl = await readFileAsDataURL(file);
            document.getElementById('logo-preview').innerHTML = `<img src="${dataUrl}" alt="Logo" />`;
            logoBtn.dataset.pendingLogo = dataUrl;
        } catch { /* ignore */ }
    });

    saveBtn.addEventListener('click', () => {
        const activeProvider = document.querySelector('.provider-btn.active')?.dataset.provider || 'groq';
        const settings = {
            apiKey: document.getElementById('setting-api-key').value.trim(),
            groqKey: document.getElementById('setting-groq-key').value.trim(),
            provider: activeProvider,
            companyName: document.getElementById('setting-company-name').value.trim(),
            companyAddr: document.getElementById('setting-company-address').value.trim(),
            companyPhone: document.getElementById('setting-company-phone').value.trim(),
            companyCity: document.getElementById('setting-company-city').value.trim(),
        };
        if (logoBtn.dataset.pendingLogo) {
            settings.companyLogo = logoBtn.dataset.pendingLogo;
            delete logoBtn.dataset.pendingLogo;
        }
        saveSettings(settings);
        modal.classList.remove('open');
        if (onSave) onSave(settings);
    });
}
