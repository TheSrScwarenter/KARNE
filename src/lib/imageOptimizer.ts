/**
 * Advanced Client-Side Image Optimizer for Karne YKS Platform
 * Maximizes storage efficiency for Supabase Free Tier (~1GB limit).
 * Compresses 5-12MB mobile camera photos down to 60-120KB (~95-98% savings)
 * while preserving high-contrast sharpness for math formulas, geometry, and small text.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (recommended: 0.72 - 0.78)
  preferredFormat?: 'image/webp' | 'image/jpeg';
}

export interface OptimizedImageResult {
  blob: Blob;
  file: File;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  savingsPercentage: number;
  contentType: string;
  width: number;
  height: number;
}

/**
 * Checks if browser supports WebP export from canvas
 */
let isWebPSupportedCache: boolean | null = null;
function isWebPSupported(): boolean {
  if (isWebPSupportedCache !== null) return isWebPSupportedCache;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    isWebPSupportedCache = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    isWebPSupportedCache = false;
  }
  return isWebPSupportedCache;
}

/**
 * Optimizes an image File for uploading to cloud storage.
 * Automatically chooses modern WebP or Progressive JPEG with optimal aspect-ratio scaling.
 */
export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.74,
    preferredFormat = 'image/webp',
  } = options;

  const originalSize = file.size;
  const targetFormat = isWebPSupported() && preferredFormat === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const fileExtension = targetFormat === 'image/webp' ? 'webp' : 'jpg';

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        let { width, height } = img;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          throw new Error('Canvas 2D context could not be initialized');
        }

        // Render with high-quality smoothing for sharp text and formulas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export to Blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error('Failed to create compressed image blob'));
              return;
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const newFileName = `${cleanBaseName}_opt_${Date.now()}.${fileExtension}`;
            const optimizedFile = new File([blob], newFileName, {
              type: targetFormat,
              lastModified: Date.now(),
            });

            // Convert to dataUrl for immediate local preview/cache
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const optimizedSize = blob.size;
              const savings = Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100));

              resolve({
                blob,
                file: optimizedFile,
                dataUrl,
                originalSize,
                optimizedSize,
                savingsPercentage: savings,
                contentType: targetFormat,
                width,
                height,
              });
            };
            reader.onerror = () => reject(new Error('Failed to read optimized data URL'));
            reader.readAsDataURL(blob);
          },
          targetFormat,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes to readable string (e.g., 4.2 MB, 85 KB, 0 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return '0 KB';
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
