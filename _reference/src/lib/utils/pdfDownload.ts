import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadAsPdf(element: HTMLDivElement, filename: string): Promise<void> {
	const a4WidthMm = 210;
	const a4HeightMm = 297;
	const margin = 15; // mm margin on each page

	await document.fonts.ready;

	// Clone element into a fresh container at document root to avoid parent CSS constraints
	const clone = element.cloneNode(true) as HTMLDivElement;
	clone.style.position = 'fixed';
	clone.style.left = '0';
	clone.style.top = '0';
	clone.style.width = '794px';
	clone.style.zIndex = '-9999';
	clone.style.pointerEvents = 'none';
	document.body.appendChild(clone);

	// Force layout
	clone.offsetWidth;

	const renderScale = 3;
	const canvas = await html2canvas(clone, {
		backgroundColor: '#ffffff',
		useCORS: true,
		logging: false,
		scale: renderScale
	} as Parameters<typeof html2canvas>[1] & { scale?: number });

	document.body.removeChild(clone);

	// The usable print area per page (inside margins)
	const printWidth = a4WidthMm - margin * 2;
	const printHeight = a4HeightMm - margin * 2;

	// Scale canvas to fit the print width
	const scale = printWidth / canvas.width;
	const totalHeightMm = canvas.height * scale;

	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const totalPages = Math.ceil(totalHeightMm / printHeight);

	for (let page = 0; page < totalPages; page++) {
		if (page > 0) {
			pdf.addPage();
		}

		// Slice the canvas for this page
		const srcY = Math.round((page * printHeight) / scale);
		const srcH = Math.round(printHeight / scale);
		const actualSrcH = Math.min(srcH, canvas.height - srcY);

		const pageCanvas = document.createElement('canvas');
		pageCanvas.width = canvas.width;
		pageCanvas.height = actualSrcH;
		const ctx = pageCanvas.getContext('2d')!;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
		ctx.drawImage(canvas, 0, srcY, canvas.width, actualSrcH, 0, 0, canvas.width, actualSrcH);

		const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
		const sliceHeightMm = actualSrcH * scale;

		pdf.addImage(pageImgData, 'PNG', margin, margin, printWidth, sliceHeightMm);
	}

	pdf.save(filename);
}
