/**
 * Compresses an image file down to a reasonable size and returns it as a
 * data URL. Phone/camera photos are often 2-8MB — storing several of those
 * as base64 in localStorage (via the app's persisted store) quickly hits
 * the browser's ~5-10MB per-origin storage quota, which silently stops
 * further saves. Resizing to a sane max dimension and re-encoding as JPEG
 * keeps each image well under ~300KB, so a full round of 6-8+ picture
 * questions (plus everything else the app persists) comfortably fits.
 */
export function compressImageToDataUrl(
  file: File,
  maxDimension = 1000,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image file.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fall back to the original (uncompressed) data URL if canvas isn't available.
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
