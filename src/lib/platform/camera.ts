import { isNative } from './index'

export async function pickPhoto(opts: {
  source: 'prompt' | 'camera' | 'library'
}): Promise<File | null> {
  if (!isNative()) return null

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const source = {
      prompt: CameraSource.Prompt,
      camera: CameraSource.Camera,
      library: CameraSource.Photos,
    }[opts.source]
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source,
      quality: 80,
      width: 1600,
      correctOrientation: true,
    })
    if (!photo.webPath) return null
    const response = await fetch(photo.webPath)
    const blob = await response.blob()
    return new File([blob], `photo-${Date.now()}.jpg`, {
      type: blob.type || 'image/jpeg',
    })
  } catch {
    return null
  }
}
