const MAX_SIZE = 400;
const JPEG_QUALITY = 0.85;

/**
 * Resize and crop an image file to a square JPEG suitable for avatar use.
 * Uses canvas to center-crop and resize to max 400x400.
 */
export async function processAvatarImage(file: File): Promise<File> {
	const bitmap = await createImageBitmap(file);
	const { width, height } = bitmap;

	// Center-crop to square
	const cropSize = Math.min(width, height);
	const sx = (width - cropSize) / 2;
	const sy = (height - cropSize) / 2;

	const outputSize = Math.min(cropSize, MAX_SIZE);

	const canvas = new OffscreenCanvas(outputSize, outputSize);
	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);
	bitmap.close();

	const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
	return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}
