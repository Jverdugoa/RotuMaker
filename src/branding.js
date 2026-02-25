/**
 * branding.js
 * Logic to extract dominant color from the logo and apply it specifically to the shipping label.
 */

/**
 * Extracts the dominant color from a base64 Image Data URL
 */
export async function getDominantColor(dataUrl) {
    if (!dataUrl) return null;

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 50;
            canvas.width = size;
            canvas.height = size;

            ctx.drawImage(img, 0, 0, size, size);
            const imageData = ctx.getImageData(0, 0, size, size).data;

            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < imageData.length; i += 4) {
                const alpha = imageData[i + 3];
                const red = imageData[i];
                const green = imageData[i + 1];
                const blue = imageData[i + 2];
                if (alpha > 125) {
                    if (red < 240 || green < 240 || blue < 240) {
                        r += red; g += green; b += blue; count++;
                    }
                }
            }
            if (count === 0) return resolve('#000000'); // Default black for labels
            resolve(rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count)));
        };
        img.onerror = () => resolve('#000000');
    });
}

/**
 * Saves the brand color to sessionStorage so it can be used during label rendering
 * without affecting the global app UI.
 */
export function applyBranding(hex) {
    if (!hex) return;
    // We store it in sessionStorage to avoid affecting the main app styles
    // but keeping it available for the label builder.
    sessionStorage.setItem('rotumaker_brand_color', hex);

    // Also update any currently visible labels in the preview
    const labels = document.querySelectorAll('.rotulo');
    labels.forEach(l => {
        l.style.setProperty('--label-accent', hex);
    });
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}
