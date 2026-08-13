// Límites duros de la API de Anthropic (ver docs.claude.com/vision).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_BYTES = 32 * 1024 * 1024; // 32 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

// Lado más largo recomendado por Anthropic para buena relación
// costo/calidad en imágenes (no tiene sentido mandar más resolución).
const TARGET_MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.85;

const fileToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result viene como "data:image/jpeg;base64,AAAA..."
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(blob);
  });

// Redimensiona/recomprime una imagen en el navegador si hace falta, para
// que quepa bajo el límite de 5MB de la API. Las fotos de celular
// normalmente pesan varios MB y superan ese límite fácilmente.
const resizeImageIfNeeded = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, TARGET_MAX_DIMENSION / Math.max(width, height));

      // Si ya es pequeña y pesa poco, no hace falta recomprimir.
      if (scale === 1 && file.size <= MAX_IMAGE_BYTES) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("No se pudo procesar la imagen."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar la imagen."));
    };

    img.src = objectUrl;
  });

// Punto de entrada único: recibe un File del <input type="file">, valida
// el tipo, comprime si es imagen, y devuelve el objeto listo para mandar
// al backend + datos livianos para mostrar en el chat.
export const prepareAttachment = async (file) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

  if (!isImage && !isDocument) {
    throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP) o PDFs.");
  }

  if (isDocument && file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("El PDF supera el máximo de 32 MB permitido.");
  }

  let blob = file;

  if (isImage) {
    blob = await resizeImageIfNeeded(file);

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error("La imagen sigue siendo muy grande incluso después de comprimirla. Prueba con otra foto.");
    }
  }

  const mediaType = isImage ? blob.type : file.type;
  const data = await fileToBase64(blob);

  return {
    kind: isImage ? "image" : "document",
    mediaType,
    data,
    name: file.name,
    sizeLabel: `${(blob.size / 1024).toFixed(0)} KB`,
  };
};