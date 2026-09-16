import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 1600,
      maxSizeMB: 1.2,
      initialQuality: 0.8,
      useWebWorker: true,
      preserveExif: false,
    })
  } catch {
    return file
  }
}
