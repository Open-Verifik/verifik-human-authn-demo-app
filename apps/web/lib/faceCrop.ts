import * as faceapi from "@vladmandic/face-api";

/**
 * Browser-only face crop aligned with verifik-backend OCR crop-face.js:
 * SSD MobileNet v1, largest face, 30% padding, clamp to image bounds.
 * Call only from client components / event handlers (never during SSR).
 */

const MODEL_URI = "/face-models";

/** Mirrors backend SsdMobilenetv1 sensitivity (backend uses scoreThreshold: 0.1). */
const MIN_CONFIDENCE = 0.1;

const PADDING = 0.3;

let loadPromise: Promise<void> | null = null;
let tfReadyPromise: Promise<void> | null = null;
type TfRuntime = {
	getBackend: () => string;
	setBackend: (backend: "webgl" | "cpu") => Promise<unknown>;
	ready: () => Promise<void>;
};

export function ensureTfReady(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("TensorFlow can only initialize in the browser"));
	}
	if (!tfReadyPromise) {
		tfReadyPromise = (async () => {
			try {
				const tf = faceapi.tf as unknown as TfRuntime;
				if (!tf.getBackend()) {
					try {
						await tf.setBackend("webgl");
					} catch {
						await tf.setBackend("cpu");
					}
				}
				await tf.ready();
			} catch (error) {
				tfReadyPromise = null;
				throw error;
			}
		})();
	}
	return tfReadyPromise;
}

/**
 * Loads SSD MobileNet v1 and Face Landmark 68 weights once (from `public/face-models`).
 * Uses `@vladmandic/face-api` (same stack as verifik-wallet-extension) with standard face-api.js model weights.
 */
export function loadFaceModels(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Face models can only load in the browser"));
	}
	if (!loadPromise) {
		loadPromise = (async () => {
			await ensureTfReady();
			await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URI);
			await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI);
			await ensureTfReady();
		})();
	}
	return loadPromise;
}

/**
 * @param rawBase64 - Raw base64 or full data URL
 * @param mime - MIME when rawBase64 has no data: prefix (default image/jpeg)
 * @returns Raw base64 (no prefix), JPEG
 */
export async function cropLargestFaceBase64(rawBase64: string, mime = "image/jpeg"): Promise<string> {
	await loadFaceModels();

	const dataUrl = rawBase64.startsWith("data:") ? rawBase64 : `data:${mime};base64,${rawBase64}`;
	const img = await faceapi.fetchImage(dataUrl);

	const detections = await faceapi.detectAllFaces(
		img,
		new faceapi.SsdMobilenetv1Options({ minConfidence: MIN_CONFIDENCE }),
	);

	if (detections.length === 0) {
		throw new Error("No faces found in the image");
	}

	const largest = detections.reduce((best, cur) => {
		const a = best.box.width * best.box.height;
		const b = cur.box.width * cur.box.height;
		return b > a ? cur : best;
	});

	const { x, y, width, height } = largest.box;
	const paddedWidth = width * (1 + PADDING);
	const paddedHeight = height * (1 + PADDING);
	let paddedX = Math.max(0, x - (width * PADDING) / 2);
	let paddedY = Math.max(0, y - (height * PADDING) / 2);

	const maxX = img.width;
	const maxY = img.height;
	const clampedWidth = Math.min(paddedWidth, maxX - paddedX);
	const clampedHeight = Math.min(paddedHeight, maxY - paddedY);

	if (clampedWidth <= 0 || clampedHeight <= 0) {
		throw new Error("Invalid extract area after padding");
	}

	const canvas = document.createElement("canvas");
	canvas.width = Math.floor(clampedWidth);
	canvas.height = Math.floor(clampedHeight);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas context");

	ctx.drawImage(
		img,
		Math.floor(paddedX),
		Math.floor(paddedY),
		Math.floor(clampedWidth),
		Math.floor(clampedHeight),
		0,
		0,
		Math.floor(clampedWidth),
		Math.floor(clampedHeight),
	);

	const jpeg = canvas.toDataURL("image/jpeg", 0.92);
	const comma = jpeg.indexOf(",");
	if (comma === -1) throw new Error("Invalid data URL output");
	return jpeg.slice(comma + 1);
}
