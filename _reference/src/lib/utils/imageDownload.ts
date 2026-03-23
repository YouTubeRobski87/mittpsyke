import html2canvas from 'html2canvas';

type ImageDownloadOptions = {
	width?: number;
	scale?: number;
	backgroundColor?: string;
};

export async function downloadAsImage(
	element: HTMLElement,
	filename: string,
	options: ImageDownloadOptions = {}
): Promise<void> {
	await document.fonts.ready;

	const rect = element.getBoundingClientRect();
	const measuredWidth = Math.ceil(rect.width || element.scrollWidth || element.offsetWidth || 0);
	const targetWidth = (options.width ?? measuredWidth) || 794;
	const renderScale = options.scale ?? 3;
	const backgroundColor = options.backgroundColor ?? '#ffffff';

	// Clone element to avoid modifying the original
	const clone = element.cloneNode(true) as HTMLElement;
	clone.style.position = 'fixed';
	clone.style.left = '0';
	clone.style.top = '0';
	clone.style.width = `${targetWidth}px`;
	clone.style.maxWidth = 'none';
	clone.style.height = 'auto';
	clone.style.zIndex = '-9999';
	clone.style.pointerEvents = 'none';
	document.body.appendChild(clone);

	// Force layout
	clone.offsetWidth;

	const canvas = await html2canvas(clone, {
		backgroundColor,
		useCORS: true,
		logging: false,
		scale: renderScale
	} as Parameters<typeof html2canvas>[1] & { scale?: number });

	document.body.removeChild(clone);

	const link = document.createElement('a');
	link.download = filename;
	link.href = canvas.toDataURL('image/png', 1.0);
	link.click();
}
