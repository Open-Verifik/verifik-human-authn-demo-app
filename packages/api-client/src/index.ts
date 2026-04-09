import { verifikConfig } from "./config";

// Base URL for all Verifik /v2 endpoints (auth + biometrics share the same host)
const ACCESS_BASE = `${verifikConfig.apiUrl}/v2`;
const BIOMETRICS_BASE = ACCESS_BASE;

export { verifikConfig };

export type ValidationMethod = "verificationCode" | "magicLink";
export type Language = "en" | "es";

export interface EmailValidationPayload {
	email: string;
	project: string;
	projectFlow: string;
	type: "login" | "register";
	validationMethod: ValidationMethod;
	language?: Language;
}

export interface PhoneValidationPayload {
	phone: string;
	countryCode: string;
	project: string;
	projectFlow: string;
	type: "login" | "register";
	validationMethod: ValidationMethod;
	language?: Language;
}

export interface ValidateOTPPayload {
	otp: string;
	// Same fields as the originating request
	email?: string;
	phone?: string;
	/** Required by POST /v2/phone-validations/validate when validating phone OTP */
	countryCode?: string;
	project: string;
	projectFlow: string;
	type: "login" | "register";
	validationMethod: ValidationMethod;
}

/** Default `liveness_min_score` when omitted on POST /face-recognition/liveness (matches OpenCV module). */
export const DEFAULT_LIVENESS_STANDALONE_MIN_SCORE = 0.6;

/** POST /v2/face-recognition/liveness — body validated by anti-spoofing middleware. */
export interface LivenessPayload {
	os: string;
	image: string;
	liveness_min_score?: number;
	collection_id?: string;
}

/** POST /v2/face-recognition/compare — matches OpenCV `compare` schema */

/** Matches FaceVerification schema default; used when request omits compare_min_score */
export const DEFAULT_FACE_COMPARE_MIN_SCORE = 0.85;

/** Default liveness minimum score for POST /face-recognition/compare-live (Joi: 0.52–1). */
export const DEFAULT_LIVENESS_MIN_SCORE = 0.65;

/** Docs default for POST /face-recognition/compare-with-liveness when `liveness_min_score` is omitted (server uses 0.6). */
export const DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR = 0.6;

export interface FaceComparisonPayload {
	/** Reference face(s), base64 (no data: URL prefix) */
	gallery: string[];
	/** Face(s) to match against gallery, base64 */
	probe: string[];
	/** Optional; server defaults to 0.85. Result includes `passed` vs this threshold */
	compare_min_score?: number;
}

/** POST /v2/face-recognition/compare-live — probe is a single base64 string (not an array). */
export interface FaceComparisonLivePayload {
	gallery: string[];
	probe: string;
	os: string;
	liveness_min_score: number;
	compare_min_score?: number;
}

/** POST /v2/face-recognition/compare-with-liveness — sequential compare then liveness on probe (Verifik docs). */
export interface CompareWithLivenessPayload {
	probe: string;
	gallery: string[];
	liveness_min_score?: number;
	compare_min_score?: number;
	cropFace?: boolean;
}

export interface ApiResponse<T = unknown> {
	data?: T;
	error?: string;
	message?: string;
	statusCode?: number;
}

/** Envelope from POST /v2/auth/project-login */
export interface ProjectLoginResponseBody {
	data?: {
		accessToken?: string;
		tokenType?: string;
		appRegistration?: unknown;
	};
	status?: string;
}

/** Flat body from GET/POST /v2/auth/session (after clientLogin + origin=app) */
export interface AuthSessionResponseBody {
	accessToken?: string;
	tokenType?: string;
	user?: {
		_id?: string;
		email?: string;
		name?: string;
		phone?: string;
		staff?: string;
		credits?: number;
		[key: string]: unknown;
	};
	settings?: unknown;
}

/** Envelope from email/phone validate when type is login */
export interface ValidationLoginData {
	token?: string;
	type?: string;
	email?: string;
	phone?: string;
	appLogin?: unknown;
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

function parseErrorMessage(json: unknown): string {
	if (!json || typeof json !== "object" || Array.isArray(json)) return "Request failed";
	const ve = (json as Record<string, unknown>).validationError;
	if (typeof ve === "string") return ve;
	const msg = (json as Record<string, unknown>).message ?? (json as Record<string, unknown>).error;
	if (typeof msg === "string") return msg;
	return "Request failed";
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	try {
		const { headers: optHeaders, ...rest } = options;
		const res = await fetch(url, {
			...rest,
			headers: {
				"Content-Type": "application/json",
				...(optHeaders as Record<string, string>),
			},
		});

		let json: Record<string, unknown> | null = null;
		try {
			json = (await res.json()) as Record<string, unknown>;
		} catch {
			/* non-JSON */
		}

		if (!res.ok) {
			return {
				error: parseErrorMessage(json),
				statusCode: res.status,
			};
		}

		return { data: json as T };
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : "Network error",
		};
	}
}

/**
 * JSON request with Authorization: Bearer …
 */
async function bearerRequest<T>(url: string, bearerToken: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	const { headers: optHeaders, ...rest } = options;
	return request<T>(url, {
		...rest,
		headers: {
			Authorization: `Bearer ${bearerToken}`,
			...(optHeaders as Record<string, string>),
		},
	});
}

// ─── Auth — Project login & Session (after email/phone OTP validate) ─────────

/**
 * Exchange the short-lived validation JWT (from email/phone validate) for a session access token.
 * POST /v2/auth/project-login — Authorization: Bearer validationToken
 */
export async function projectLogin(validationToken: string, body: Record<string, unknown> = {}): Promise<ApiResponse<ProjectLoginResponseBody>> {
	return bearerRequest<ProjectLoginResponseBody>(`${ACCESS_BASE}/auth/project-login`, validationToken, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

/**
 * Refresh / hydrate session; with origin=app returns user + settings via _additionalLoginData.
 * GET /v2/auth/session?origin=app — Authorization: Bearer accessToken
 */
export async function authSession(
	accessToken: string,
	opts: { origin?: string; method?: "GET" | "POST" } = {},
): Promise<ApiResponse<AuthSessionResponseBody>> {
	const origin = opts.origin ?? "app";
	const method = opts.method ?? "GET";

	if (method === "GET") {
		const url = `${ACCESS_BASE}/auth/session?${new URLSearchParams({ origin }).toString()}`;
		return bearerRequest<AuthSessionResponseBody>(url, accessToken, { method: "GET" });
	}

	return bearerRequest<AuthSessionResponseBody>(`${ACCESS_BASE}/auth/session`, accessToken, {
		method: "POST",
		body: JSON.stringify({ origin }),
	});
}

/** Parse token from POST …/email-validations/validate or phone equivalent (body = full JSON). */
export function getValidationLoginToken(body: unknown): string | null {
	if (!body || typeof body !== "object") return null;
	const data = (body as { data?: ValidationLoginData }).data;
	if (!data?.token || data.type !== "login") return null;
	return data.token;
}

/** Parse accessToken from POST /v2/auth/project-login response body. */
export function getProjectLoginAccessToken(body: unknown): string | null {
	if (!body || typeof body !== "object") return null;
	return (body as ProjectLoginResponseBody).data?.accessToken ?? null;
}

// ─── Auth — Email Validations ─────────────────────────────────────────────────

/**
 * Step 1: Send a verification code to the user's email.
 * POST /v2/email-validations
 */
export async function sendEmailOTP(payload: EmailValidationPayload): Promise<ApiResponse> {
	return request(`${ACCESS_BASE}/email-validations`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/**
 * Step 2: Validate the OTP code sent to the user's email.
 * POST /v2/email-validations/validate
 */
export async function validateEmailOTP(payload: ValidateOTPPayload): Promise<ApiResponse> {
	return request(`${ACCESS_BASE}/email-validations/validate`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── Auth — Phone Validations ─────────────────────────────────────────────────

/**
 * Step 1: Send a verification code to the user's phone.
 * POST /v2/phone-validations
 */
export async function sendPhoneOTP(payload: PhoneValidationPayload): Promise<ApiResponse> {
	return request(`${ACCESS_BASE}/phone-validations`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/**
 * Step 2: Validate the OTP code sent to the user's phone.
 * POST /v2/phone-validations/validate
 */
export async function validatePhoneOTP(payload: ValidateOTPPayload): Promise<ApiResponse> {
	return request(`${ACCESS_BASE}/phone-validations/validate`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── Biometrics — Liveness Detection ─────────────────────────────────────────

/**
 * Run liveness detection on a captured face image.
 * POST /v2/face-recognition/liveness — requires session access JWT (same as web app login).
 */
export async function detectLiveness(payload: LivenessPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/liveness`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── Biometrics — Face Comparison ────────────────────────────────────────────

/**
 * Compare gallery vs probe face images (Verifik OpenCV).
 * POST /v2/face-recognition/compare — requires session access JWT.
 * Body: { gallery, probe, compare_min_score? }
 */
export async function compareFaces(payload: FaceComparisonPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/compare`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/**
 * Compare gallery vs probe with embedded liveness (OpenCV compare-live-face).
 * POST /v2/face-recognition/compare-live — requires session access JWT.
 */
export async function compareFacesLive(payload: FaceComparisonLivePayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/compare-live`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/**
 * Compare then liveness on probe (sequential). See Verifik docs: compare-with-liveness.
 * POST /v2/face-recognition/compare-with-liveness — requires session access JWT.
 */
export async function compareWithLiveness(payload: CompareWithLivenessPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/compare-with-liveness`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/**
 * Normalize compare API response for UI.
 * Handles Verifik envelope `{ data: { result: { score, passed } }, signature, id }` and flat documents.
 * Prefers backend `result.passed`; else compares score to `result.compare_min_score` or document `compare_min_score`.
 */
export function parseFaceCompareResult(data: unknown): { match: boolean; score: number; message: string } {
	if (!data || typeof data !== "object") return { match: false, score: 0, message: "" };
	let doc = data as Record<string, unknown>;
	const envelope = doc.data;
	if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
		doc = envelope as Record<string, unknown>;
	}
	const innerRaw = doc.result;
	const inner =
		innerRaw && typeof innerRaw === "object" && !Array.isArray(innerRaw)
			? (innerRaw as Record<string, unknown>)
			: doc;
	let score = typeof inner.score === "number" ? inner.score : 0;
	if (score > 1) score /= 100;

	let match: boolean;
	if (typeof inner.passed === "boolean") {
		match = inner.passed;
	} else {
		const thresholdRaw = inner.compare_min_score ?? doc.compare_min_score;
		const threshold =
			typeof thresholdRaw === "number" ? thresholdRaw : DEFAULT_FACE_COMPARE_MIN_SCORE;
		match = score >= threshold;
	}

	const message = typeof inner.message === "string" ? inner.message : "";
	return { match, score, message };
}

/** Normalized compare-live (`compareLive` type) API document: face similarity + probe liveness. */
export interface FaceCompareLiveParsed {
	/** Face similarity vs `compare_min_score` on the document */
	match: boolean;
	score: number;
	/** Parsed `result.liveness_score` (API may send string or number) */
	livenessScore: number | null;
	/** `liveness_score` ≥ document `liveness_min_score` */
	livenessPassed: boolean;
	/** Echo of `liveness_min_score` from the response (for UI labels) */
	livenessMinScore: number;
	message: string;
}

function coerceScore01(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value === "number" && !Number.isNaN(value)) return value > 1 ? value / 100 : value;
	if (typeof value === "string") {
		const n = parseFloat(value.trim());
		if (Number.isNaN(n)) return null;
		return n > 1 ? n / 100 : n;
	}
	return null;
}

/** Normalized POST /face-recognition/liveness response (`data`: passed, liveness_score, min_score). */
export interface LivenessParsed {
	passed: boolean;
	livenessScore: number | null;
	minScore: number;
	message: string;
}

/**
 * Parse signed envelope `{ data, signature, id }` or inner `data` from POST /face-recognition/liveness.
 */
export function parseLivenessResult(raw: unknown): LivenessParsed {
	const empty: LivenessParsed = {
		passed: false,
		livenessScore: null,
		minScore: DEFAULT_LIVENESS_STANDALONE_MIN_SCORE,
		message: "",
	};
	if (!raw || typeof raw !== "object") return empty;
	let doc = raw as Record<string, unknown>;
	const envelope = doc.data;
	if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
		doc = envelope as Record<string, unknown>;
	}
	const livenessScore = coerceScore01(doc.liveness_score);
	const minRaw = doc.min_score;
	const minScore =
		typeof minRaw === "number" && !Number.isNaN(minRaw) ? minRaw : DEFAULT_LIVENESS_STANDALONE_MIN_SCORE;
	let passed = typeof doc.passed === "boolean" ? doc.passed : false;
	if (typeof doc.passed !== "boolean" && livenessScore != null) {
		passed = livenessScore >= minScore;
	}
	const message = typeof doc.message === "string" ? doc.message : "";
	return { passed, livenessScore, minScore, message };
}

/**
 * Normalize compare-live response (`type: compareLive`) with `result.score` and `result.liveness_score`.
 * Handles Verifik `{ data: { … } }` envelope.
 */
export function parseFaceCompareLiveResult(data: unknown): FaceCompareLiveParsed {
	const base = parseFaceCompareResult(data);
	if (!data || typeof data !== "object") {
		return {
			match: base.match,
			score: base.score,
			livenessScore: null,
			livenessPassed: true,
			livenessMinScore: DEFAULT_LIVENESS_MIN_SCORE,
			message: base.message,
		};
	}
	let doc = data as Record<string, unknown>;
	const envelope = doc.data;
	if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
		doc = envelope as Record<string, unknown>;
	}
	const innerRaw = doc.result;
	const inner =
		innerRaw && typeof innerRaw === "object" && !Array.isArray(innerRaw)
			? (innerRaw as Record<string, unknown>)
			: ({} as Record<string, unknown>);

	const livenessScore = coerceScore01(inner.liveness_score);
	const livenessMinRaw = doc.liveness_min_score;
	const livenessMinScore =
		typeof livenessMinRaw === "number" ? livenessMinRaw : DEFAULT_LIVENESS_MIN_SCORE;
	/** If the API omits `liveness_score`, do not fail the liveness gate (show score as unavailable in UI). */
	const livenessPassed =
		livenessScore != null ? livenessScore >= livenessMinScore : true;

	return {
		match: base.match,
		score: base.score,
		livenessScore,
		livenessPassed,
		livenessMinScore,
		message: base.message,
	};
}

/** Parsed POST /compare-with-liveness body (`data.comparison` + optional `data.liveness`). */
export interface CompareWithLivenessParsed {
	/** Face similarity vs `comparison.compare_min_score` */
	match: boolean;
	score: number;
	livenessScore: number | null;
	livenessPassed: boolean;
	livenessMinScore: number;
	/** True when compare threshold was not met — liveness step was not executed */
	livenessSkipped: boolean;
	message: string;
}

/**
 * Normalize compare-with-liveness response: `data.comparison` (FaceVerification doc) and optional `data.liveness` (liveness run).
 */
export function parseCompareWithLivenessResult(data: unknown): CompareWithLivenessParsed {
	const empty: CompareWithLivenessParsed = {
		match: false,
		score: 0,
		livenessScore: null,
		livenessPassed: false,
		livenessMinScore: DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR,
		livenessSkipped: true,
		message: "",
	};
	if (!data || typeof data !== "object") return empty;

	let root = data as Record<string, unknown>;
	const envelope = root.data;
	if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
		root = envelope as Record<string, unknown>;
	}

	const comparison = root.comparison as Record<string, unknown> | undefined;
	const livenessDoc = root.liveness as Record<string, unknown> | undefined | null;

	let score = 0;
	let match = false;
	if (comparison && typeof comparison === "object") {
		const res = comparison.result as Record<string, unknown> | undefined;
		if (res && typeof res.score === "number") {
			score = res.score;
			if (score > 1) score /= 100;
		}
		const thresholdRaw = comparison.compare_min_score;
		const threshold =
			typeof thresholdRaw === "number" ? thresholdRaw : DEFAULT_FACE_COMPARE_MIN_SCORE;
		match = score >= threshold;
	}

	const livenessSkipped = livenessDoc == null;

	let livenessScore: number | null = null;
	let livenessPassed = false;
	let livenessMinScore = DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR;

	if (!livenessSkipped && livenessDoc && typeof livenessDoc === "object") {
		const lr = livenessDoc.result as Record<string, unknown> | undefined;
		if (lr && typeof lr === "object") {
			livenessScore = coerceScore01(lr.liveness_score);
			if (typeof lr.min_score === "number") livenessMinScore = lr.min_score;
			if (typeof lr.passed === "boolean") {
				livenessPassed = lr.passed;
			} else if (livenessScore != null) {
				livenessPassed = livenessScore >= livenessMinScore;
			}
		}
	}

	return {
		match,
		score,
		livenessScore,
		livenessPassed,
		livenessMinScore,
		livenessSkipped,
		message: "",
	};
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Convert a File or Blob to base64 string (browser/RN compatible).
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve((reader.result as string).split(",")[1]);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// ─── OpenCV: Collections ──────────────────────────────────────────────────────

export interface CreateCollectionPayload {
	name: string;
	description?: string;
}

/** POST /v2/face-recognition/collections — create a named face collection. */
export async function createCollection(payload: CreateCollectionPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/collections`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── OpenCV: Persons ──────────────────────────────────────────────────────────

export interface CreatePersonPayload {
	name: string;
	images: string[];
	gender: "M" | "F";
	date_of_birth: string;
	collections: string[];
	nationality?: string;
	email?: string;
	phone?: string;
	notes?: string;
}

export interface CreatePersonWithLivenessPayload {
	name: string;
	images: string[];
	gender: "M" | "F";
	date_of_birth: string;
	collection_id: string;
	liveness_min_score: number;
	min_score: number;
	search_mode: "FAST" | "ACCURATE";
	nationality?: string;
}

/** POST /v2/face-recognition/persons — enroll a new person. */
export async function createPerson(payload: CreatePersonPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/persons`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/face-recognition/persons/search-live-face — enroll + liveness + dedup search. */
export async function createPersonWithLiveness(
	payload: CreatePersonWithLivenessPayload,
	accessToken: string,
): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/persons/search-live-face`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── OpenCV: Search ───────────────────────────────────────────────────────────

export type SearchMode = "FAST" | "ACCURATE";

export interface SearchPersonsPayload {
	images: string[];
	min_score: number;
	search_mode: SearchMode;
	collection_id?: string;
	max_results?: number;
}

export interface SearchLivePersonPayload {
	image: string;
	os: string;
	liveness_min_score: number;
	min_score: number;
	search_mode: SearchMode;
	collection_id?: string;
}

export interface SearchActiveUserPayload {
	image: string;
	os: string;
	min_score: number;
	search_mode: SearchMode;
	collection_id?: string;
}

export interface DetectFacePayload {
	image: string;
	min_score: number;
	search_mode: SearchMode;
	collection_id?: string;
	max_results?: number;
}

export interface VerifyFacePayload {
	id: string;
	images: string[];
	min_score: number;
	search_mode: SearchMode;
	collection_id?: string;
}

export interface SearchCropsPayload {
	images: string[];
	min_score: number;
	search_mode: SearchMode;
	collection_id?: string;
	max_results?: number;
}

/** POST /v2/face-recognition/search — 1:N face search. */
export async function searchPersons(payload: SearchPersonsPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/search`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/face-recognition/search-live-face — 1:N search with liveness. */
export async function searchLivePerson(payload: SearchLivePersonPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/search-live-face`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/face-recognition/search-active-user — liveness + 1:N search for active user auth. */
export async function searchActiveUser(payload: SearchActiveUserPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/search-active-user`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/face-recognition/detect — detect all faces in an image. */
export async function detectFace(payload: DetectFacePayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/detect`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/face-recognition/verify — 1:1 verification against an enrolled person by id. */
export async function verifyFace(payload: VerifyFacePayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/verify`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/face-recognition/search/crops — multi-image crop search. */
export async function searchCrops(payload: SearchCropsPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/search/crops`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── OpenCV: Compare Live ─────────────────────────────────────────────────────

export interface CompareLivePayload {
	gallery: string[];
	probe: string;
	os: string;
	liveness_min_score: number;
	compare_min_score?: number;
}

/** POST /v2/face-recognition/compare-live — single-shot gallery+probe comparison with liveness. */
export async function compareLive(payload: CompareLivePayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/face-recognition/compare-live`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// ─── ZelfProof / HumanID ──────────────────────────────────────────────────────

export interface ZelfProofPublicData {
	[key: string]: string;
}

export interface CreateHumanIdPayload {
	publicData: ZelfProofPublicData;
	faceBase64: string;
	livenessLevel: string;
	metadata: ZelfProofPublicData;
	os: "DESKTOP" | "IOS" | "ANDROID";
	identifier: string;
	requireLiveness: boolean;
	livenessDetectionPriorCreation?: boolean;
	password?: string;
	referenceFaceBase64?: string;
	tolerance?: "REGULAR" | "SOFT" | "HARDENED";
	verifierKey?: string;
}

export interface DecryptHumanIdPayload {
	faceBase64: string;
	os: "DESKTOP" | "IOS" | "ANDROID";
	zelfProof: string;
	livenessLevel?: string;
	password?: string;
	verifierKey?: string;
}

export interface PreviewHumanIdPayload {
	zelfProof: string;
	verifierKey?: string;
}

export interface PreviewZelfIdQrPayload {
	/** Base64 image (optionally with data URL prefix) or HTTPS URL to a PNG/JPEG containing the HumanID QR */
	zelfProofQRCode: string;
	verifierKey?: string;
}

/** POST /v2/human-id/encrypt — create a HumanID proof stored on IPFS. */
export async function createHumanId(payload: CreateHumanIdPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/human-id/encrypt`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/human-id/encrypt-qr-code — create a HumanID as a QR-code PNG. */
export async function createHumanIdQr(payload: CreateHumanIdPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/human-id/encrypt-qr-code`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/human-id/decrypt — recover identity data from a HumanID proof with a live face. */
export async function decryptHumanId(payload: DecryptHumanIdPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/human-id/decrypt`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/human-id/preview — inspect public metadata inside a proof, no face required. */
export async function previewHumanId(payload: PreviewHumanIdPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/human-id/preview`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** POST /v2/human-id/preview-zelf-id-qr — decode HumanID from a QR image, then preview (response includes `zelfProof`). */
export async function previewZelfIdQr(payload: PreviewZelfIdQrPayload, accessToken: string): Promise<ApiResponse> {
	return bearerRequest(`${BIOMETRICS_BASE}/human-id/preview-zelf-id-qr`, accessToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export { ACCESS_BASE, BIOMETRICS_BASE };
