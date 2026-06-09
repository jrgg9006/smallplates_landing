// Reason: iPhone screenshots and modern photos routinely exceed 5MB as PNG, and
// the iOS photo picker often hands us HEIC, which the couple-image endpoint
// rejects. We downscale and re-encode to JPEG in the browser before upload so
// the server never has to deal with raw 5-10MB files or unsupported formats.
// Uses the native Canvas API — no deps. HEIC only decodes on browsers that
// support it natively (Safari); elsewhere img.onerror fires and the caller
// surfaces a "save it as JPEG first" message.
export async function compressImageForUpload(file: File): Promise<File> {
  const MAX_DIMENSION = 2000;
  const QUALITY = 0.85;

  const objectUrl = URL.createObjectURL(file);
  const img = new window.Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = objectUrl;
    });

    let { width, height } = img;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height / width) * MAX_DIMENSION);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width / height) * MAX_DIMENSION);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", QUALITY);
    });

    if (!blob) throw new Error("Could not encode image");

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
