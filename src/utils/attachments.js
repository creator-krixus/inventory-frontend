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

// Las fotos de iPhone se guardan por defecto en HEIC/HEIF. Ningún
// navegador aparte de Safari puede decodificar ese formato de forma
// nativa (ni con <img>, ni con <canvas>).
//
// PROBLEMA REAL: algunas apps/flujos de iOS (AirDrop, ciertas apps de
// mensajería, etc.) renombran el archivo a ".jpeg" y reportan
// type:"image/jpeg" SIN convertir realmente los bytes — el contenido
// sigue siendo HEIC puro disfrazado de JPEG. Confiar solo en la
// extensión/MIME (que puede mentir) deja pasar esos archivos sin
// convertir, y Claude no puede leerlos.
//
// La solución robusta es mirar la FIRMA real del archivo: los HEIC/HEIF
// son contenedores ISO-BMFF (como MP4), que siempre traen un box "ftyp"
// en los primeros bytes seguido de un "major brand" identificable
// (heic, heix, mif1, etc.) — eso no se puede disfrazar con solo
// renombrar el archivo.
const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"];

const sniffIsHeicBySignature = async (file) => {
  try {
    // Bytes 4-7 del archivo = tipo de box (debe ser "ftyp");
    // bytes 8-11 = major brand (heic, mif1, etc.)
    const buffer = await file.slice(4, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const boxType = String.fromCharCode(...bytes.slice(0, 4));
    const brand = String.fromCharCode(...bytes.slice(4, 8)).toLowerCase();
    return boxType === "ftyp" && HEIC_BRANDS.includes(brand);
  } catch (err) {
    console.error("[HEIC] No se pudo inspeccionar la firma del archivo:", err);
    return false;
  }
};

const isHeicFile = async (file) => {
  const byNameOrType =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);

  if (byNameOrType) {
    return true;
  }

  // Aunque diga "image/jpeg" y termine en .jpeg, se revisa la firma real
  // por si el archivo viene "disfrazado" (caso real encontrado).
  return sniffIsHeicBySignature(file);
};

// Convierte HEIC/HEIF a JPEG en el navegador usando heic2any (decodifica
// vía WebAssembly, funciona en cualquier navegador). Se importa de forma
// perezosa (dynamic import) para no cargar esta librería pesada en el
// bundle inicial si el usuario nunca sube una foto HEIC.
const convertHeicToJpeg = async (file) => {
  let heic2any;

  try {
    ({ default: heic2any } = await import("heic2any"));
  } catch (err) {
    console.error("[HEIC] Error cargando heic2any (¿corriste npm install?):", err);
    throw new Error(
      "No se pudo cargar el conversor de HEIC. Intenta exportar la foto como JPG desde tu galería antes de subirla."
    );
  }

  try {
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    // heic2any puede devolver un array si el HEIC trae varias imágenes
    // (ej. Live Photos/ráfagas); nos quedamos con la primera.
    const blob = Array.isArray(result) ? result[0] : result;

    return new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  } catch (err) {
    console.error("[HEIC] Error durante la conversión:", err);
    throw new Error(
      "No se pudo convertir la foto HEIC. Prueba tomarla en formato JPG (Ajustes > Cámara > Formatos > Más compatible) o expórtala como JPG antes de subirla."
    );
  }
};

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

  // Si es HEIC/HEIF, se convierte a JPEG PRIMERO — a partir de acá el resto
  // del pipeline (validación, resize, base64) trabaja como si siempre
  // hubiera sido un JPEG normal.
  const heicDetected = await isHeicFile(file);

  const workingFile = heicDetected ? await convertHeicToJpeg(file) : file;

  const isImage = ALLOWED_IMAGE_TYPES.includes(workingFile.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(workingFile.type);

  if (!isImage && !isDocument) {
    throw new Error("Solo se permiten imágenes (JPG, PNG, GIF, WEBP, HEIC) o PDFs.");
  }

  if (isDocument && workingFile.size > MAX_DOCUMENT_BYTES) {
    throw new Error("El PDF supera el máximo de 32 MB permitido.");
  }

  let blob = workingFile;

  if (isImage) {
    blob = await resizeImageIfNeeded(workingFile);

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error("La imagen sigue siendo muy grande incluso después de comprimirla. Prueba con otra foto.");
    }
  }

  const mediaType = isImage ? blob.type : workingFile.type;

  const data = await fileToBase64(blob);

  return {
    kind: isImage ? "image" : "document",
    mediaType,
    data,
    name: workingFile.name,
    sizeLabel: `${(blob.size / 1024).toFixed(0)} KB`,
  };
};