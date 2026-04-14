import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../messages/demos");

const seeds = {
	createPerson: {
		en: { headerTitle: "Create Person" },
		es: { headerTitle: "Crear persona" },
	},
	createPersonWithLiveness: {
		en: { headerTitle: "Create Person with Liveness" },
		es: { headerTitle: "Crear persona con vida" },
	},
	updatePerson: {
		en: { headerTitle: "Update Person" },
		es: { headerTitle: "Actualizar persona" },
	},
	deletePerson: {
		en: { headerTitle: "Delete Person" },
		es: { headerTitle: "Eliminar persona" },
	},
	searchPerson: {
		en: { headerTitle: "Search Person" },
		es: { headerTitle: "Buscar persona" },
	},
	searchLivePerson: {
		en: { headerTitle: "Search Live Person" },
		es: { headerTitle: "Buscar persona en vivo" },
	},
	searchActiveUser: {
		en: { headerTitle: "Search Active User" },
		es: { headerTitle: "Buscar usuario activo" },
	},
	searchCrops: {
		en: { headerTitle: "Search Crops" },
		es: { headerTitle: "Buscar recortes" },
	},
	detectFace: {
		en: { headerTitle: "Detect Face" },
		es: { headerTitle: "Detectar rostro" },
	},
	faceComparison: {
		en: { headerTitle: "Face Comparison" },
		es: { headerTitle: "Comparación facial" },
	},
	faceComparisonLiveness: {
		en: { headerTitle: "Compare with liveness" },
		es: { headerTitle: "Comparar con vida" },
	},
	verifyFace: {
		en: { headerTitle: "Verify Face" },
		es: { headerTitle: "Verificar rostro" },
	},
	liveness: {
		en: { headerTitle: "Liveness Detection" },
		es: { headerTitle: "Detección de vida" },
	},
	humanid: {
		en: { headerTitle: "HumanID" },
		es: { headerTitle: "HumanID" },
	},
	humanidCreate: {
		en: { headerTitle: "Create HumanID" },
		es: { headerTitle: "Crear HumanID" },
	},
	humanidCreateQr: {
		en: { headerTitle: "Create HumanID QR" },
		es: { headerTitle: "Crear HumanID QR" },
	},
	humanidDecrypt: {
		en: { headerTitle: "Decrypt HumanID" },
		es: { headerTitle: "Descifrar HumanID" },
	},
	humanidPreview: {
		en: { headerTitle: "Preview HumanID" },
		es: { headerTitle: "Vista previa HumanID" },
	},
	faceDetection: {
		en: { metaTitle: "Face Detection Demo", metaDescription: "Detect faces via Verifik HumanAuthn API (same demo as Detect Face)." },
		es: { metaTitle: "Demo detección facial", metaDescription: "Detecta rostros vía la API HumanAuthn de Verifik (misma demo que Detectar rostro)." },
	},
	searchPersonResult: {
		en: { tabMatches: "Matches", tabRaw: "Raw JSON" },
		es: { tabMatches: "Coincidencias", tabRaw: "JSON en bruto" },
	},
	searchLivePersonResult: {
		en: { tabMatches: "Matches", tabRaw: "Raw JSON" },
		es: { tabMatches: "Coincidencias", tabRaw: "JSON en bruto" },
	},
	searchActiveUserResult: {
		en: { tabMatches: "Matches", tabRaw: "Raw JSON" },
		es: { tabMatches: "Coincidencias", tabRaw: "JSON en bruto" },
	},
	humanIdPreviewResult: {
		en: { title: "HumanID preview", subtitle: "Public metadata and requirements from your ZelfProof." },
		es: { title: "Vista previa HumanID", subtitle: "Metadatos públicos y requisitos de tu ZelfProof." },
	},
	humanIdDecryptResult: {
		en: { title: "Decrypted" },
		es: { title: "Descifrado" },
	},
	humanIdStructuredResult: {
		en: { successTitle: "Success", charged: "Charged: {amount} credits", creditChange: "Credit change: {amount}" },
		es: { successTitle: "Correcto", charged: "Cobrado: {amount} créditos", creditChange: "Cambio de créditos: {amount}" },
	},
};

for (const [ns, locales] of Object.entries(seeds)) {
	for (const [locale, patch] of Object.entries(locales)) {
		const filePath = path.join(root, locale, `${ns}.json`);
		let data = {};
		try {
			data = JSON.parse(fs.readFileSync(filePath, "utf8"));
		} catch {
			data = {};
		}
		fs.writeFileSync(filePath, JSON.stringify({ ...data, ...patch }, null, 2) + "\n");
	}
}
