import React, { useState, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Image,
	Alert,
	Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { detectLiveness, parseLivenessResult } from "@humanauthn/api-client";
import { colors, typography, spacing, radius, gradients } from "../../constants/tokens";
import { getMobileAuthSession } from "../../lib/authSession";

type LivenessState = "idle" | "camera" | "processing" | "result";

type Step = 1 | 2;

const STEPPER_LABELS = ["CAPTURE", "RESULT"] as const;

interface LivenessResult {
	isLive: boolean;
	confidence: number;
	action: string;
}

export default function LivenessScreen() {
	const router = useRouter();
	const [permission, requestPermission] = useCameraPermissions();
	const [state, setState] = useState<LivenessState>("idle");
	const [capturedUri, setCapturedUri] = useState<string | null>(null);
	const [result, setResult] = useState<LivenessResult | null>(null);
	const [error, setError] = useState("");
	const cameraRef = useRef<CameraView>(null);

	const openCamera = async () => {
		if (!permission?.granted) {
			const { granted } = await requestPermission();
			if (!granted) {
				setError("Camera permission required");
				return;
			}
		}
		setState("camera");
	};

	const capture = async () => {
		try {
			const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8, base64: true });
			if (photo) {
				setCapturedUri(photo.uri);
				runLiveness(photo.base64 ?? "");
			}
		} catch {
			setError("Failed to capture. Try again.");
			setState("idle");
		}
	};

	const pickFromGallery = async () => {
		const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, base64: true });
		if (!res.canceled && res.assets[0]) {
			setCapturedUri(res.assets[0].uri);
			runLiveness(res.assets[0].base64 ?? "");
		}
	};

	const runLiveness = async (base64: string) => {
		setState("processing");
		setError("");
		const session = await getMobileAuthSession();
		if (!session?.accessToken) {
			Alert.alert("Sign in required", "Sign in from Home to run this demo.");
			setState("idle");
			return;
		}
		try {
			const os = Platform.OS === "ios" ? "IOS" : "ANDROID";
			const res = await detectLiveness({ os, image: base64 }, session.accessToken);
			if (res.error) {
				setError(res.error);
				setState("idle");
				return;
			}
			const parsed = parseLivenessResult(res.data);
			const pct = parsed.livenessScore != null ? Math.round(parsed.livenessScore * 100) : 0;
			setResult({
				isLive: parsed.passed,
				confidence: pct,
				action: parsed.message || (parsed.passed ? "LIVENESS_PASSED" : "LIVENESS_FAILED"),
			});
			setState("result");
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Request failed");
			setState("idle");
		}
	};

	const reset = () => {
		setState("idle");
		setCapturedUri(null);
		setResult(null);
		setError("");
	};

	const step: Step = state === "processing" || state === "result" ? 2 : 1;

	// ── Camera View ──────────────────────────────────────────────────────────────
	if (state === "camera") {
		return (
			<View style={{ flex: 1, backgroundColor: "#000" }}>
				<CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
					{/* HUD corners */}
					<View style={[styles.corner, { top: 60, left: 32 }]} />
					<View style={[styles.corner, styles.cornerTR, { top: 60, right: 32 }]} />
					<View style={[styles.corner, styles.cornerBL, { bottom: 160, left: 32 }]} />
					<View style={[styles.corner, styles.cornerBR, { bottom: 160, right: 32 }]} />

					<View style={styles.cameraGuide}>
						<Text style={styles.cameraGuideText}>Center your face · Good lighting</Text>
					</View>
					<View style={styles.shutterRow}>
						<TouchableOpacity style={styles.shutter} onPress={capture} activeOpacity={0.85}>
							<LinearGradient colors={gradients.primaryCta} style={styles.shutterGradient}>
								<Ionicons name="camera" size={30} color={colors.onPrimaryContainer} />
							</LinearGradient>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => setState("idle")} style={styles.cancelBtn}>
							<Text style={styles.cancelText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</CameraView>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
						<Ionicons name="arrow-back" size={22} color={colors.onSurface} />
					</TouchableOpacity>
					<View style={styles.stepper}>
						{STEPPER_LABELS.map((label, i) => (
							<View key={label} style={styles.stepItem}>
								<View style={[styles.stepCircle, step > i + 1 && styles.stepDone, step === i + 1 && styles.stepActive]}>
									{step > i + 1 ? (
										<Ionicons name="checkmark" size={12} color={colors.white} />
									) : (
										<Text style={styles.stepNum}>{i + 1}</Text>
									)}
								</View>
								<Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>{label}</Text>
								{i < 1 && <View style={styles.stepLine} />}
							</View>
						))}
					</View>
				</View>
			</SafeAreaView>

			{/* ── Processing ─────────────────────────────────── */}
			{state === "processing" && (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text style={styles.processingTitle}>Analyzing Liveness…</Text>
					<Text style={styles.processingBody}>Running anti-spoofing algorithms</Text>
				</View>
			)}

			{/* ── Idle & Result ───────────────────────────────── */}
			{(state === "idle" || state === "result") && (
				<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
					<Text style={styles.title}>{state === "result" ? "Analysis Complete" : "Liveness Detection"}</Text>
					<Text style={styles.subtitle}>
						{state === "result" ? "Biometric liveness check finished." : "Select a source to verify human presence."}
					</Text>

					{/* Viewport / Result image */}
					{state === "idle" && (
						<View style={styles.viewport}>
							<View style={[styles.corner, { top: 16, left: 16 }]} />
							<View style={[styles.corner, styles.cornerTR, { top: 16, right: 16 }]} />
							<Ionicons name="scan-circle-outline" size={72} color={colors.outlineVariant} style={{ opacity: 0.25 }} />
							<Text style={styles.viewportLabel}>System Ready · No Signal</Text>
						</View>
					)}

					{state === "result" && capturedUri && (
						<View style={styles.capturedWrap}>
							<Image source={{ uri: capturedUri }} style={styles.capturedImage} />
							<View style={styles.capturedBadge}>
								<Ionicons
									name={result?.isLive ? "checkmark-circle" : "close-circle"}
									size={36}
									color={result?.isLive ? "#4ade80" : colors.error}
								/>
							</View>
						</View>
					)}

					{/* Error */}
					{!!error && (
						<View style={styles.errorRow}>
							<Ionicons name="alert-circle" size={14} color={colors.error} />
							<Text style={styles.errorText}>{error}</Text>
						</View>
					)}

					{/* Capture buttons — idle only */}
					{state === "idle" && (
						<View style={styles.btnRow}>
							<TouchableOpacity style={styles.halfBtn} onPress={openCamera} activeOpacity={0.8}>
								<Ionicons name="camera-outline" size={22} color={colors.primary} />
								<Text style={styles.halfBtnText}>Capture Selfie</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.halfBtn} onPress={pickFromGallery} activeOpacity={0.8}>
								<Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
								<Text style={styles.halfBtnText}>Upload Photo</Text>
							</TouchableOpacity>
						</View>
					)}

					{/* Result card */}
					{state === "result" && result && (
						<View style={styles.resultCard}>
							<Text style={[styles.resultStatus, { color: result.isLive ? "#4ade80" : colors.error }]}>
								{result.isLive ? "✓ LIVE HUMAN CONFIRMED" : "✗ SPOOF DETECTED"}
							</Text>
							<Text style={styles.resultScore}>{result.confidence}%</Text>
							<Text style={styles.resultScoreLabel}>Confidence Score</Text>
							<View style={styles.resultMeta}>
								<Text style={styles.resultMetaLabel}>Detection</Text>
								<Text style={styles.resultMetaValue}>{result.action}</Text>
							</View>
							<TouchableOpacity style={styles.retryBtn} onPress={reset} activeOpacity={0.8}>
								<Ionicons name="refresh-outline" size={16} color={colors.primary} />
								<Text style={styles.retryText}>Run Another Test</Text>
							</TouchableOpacity>
						</View>
					)}

					<View style={{ height: spacing["3xl"] }} />
				</ScrollView>
			)}
		</View>
	);
}

const CORNER_S = 20;
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.surface },
	header: { flexDirection: "row", alignItems: "center", paddingRight: spacing.sm },
	backBtn: { padding: spacing.base },
	stepper: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
	stepItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
	stepCircle: {
		width: 22,
		height: 22,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceContainerHigh,
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	stepActive: { borderColor: colors.primary, backgroundColor: "rgba(38,66,255,0.12)" },
	stepDone: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
	stepNum: { color: colors.outline, fontSize: 9, fontWeight: typography.weights.bold },
	stepLabel: {
		color: colors.outline,
		fontSize: 8,
		fontWeight: typography.weights.bold,
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
	stepLabelActive: { color: colors.primary },
	stepLine: { width: 16, height: 1, backgroundColor: "rgba(42,58,88,0.2)", marginHorizontal: 2 },
	centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.base, paddingHorizontal: spacing["3xl"] },
	processingTitle: { color: colors.onSurface, fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, textAlign: "center" },
	processingBody: { color: colors.onSurfaceVariant, fontSize: typography.sizes.base, textAlign: "center" },
	scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.base },
	title: {
		color: colors.onSurface,
		fontSize: typography.sizes["3xl"],
		fontWeight: typography.weights.black,
		letterSpacing: -0.8,
		marginBottom: spacing.xs,
	},
	subtitle: { color: colors.onSurfaceVariant, fontSize: typography.sizes.base, marginBottom: spacing.xl },
	viewport: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: colors.surfaceContainerLow,
		borderRadius: radius.xl,
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.15)",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.base,
		marginBottom: spacing.lg,
		overflow: "hidden",
		position: "relative",
	},
	viewportLabel: {
		color: colors.outline,
		fontSize: typography.sizes.xs,
		fontWeight: typography.weights.semibold,
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	corner: { position: "absolute", width: CORNER_S, height: CORNER_S, borderColor: colors.primary, borderTopWidth: 2, borderLeftWidth: 2 },
	cornerTR: { borderTopWidth: 2, borderLeftWidth: 0, borderRightWidth: 2 },
	cornerBL: { borderTopWidth: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
	cornerBR: { borderTopWidth: 0, borderLeftWidth: 0, borderBottomWidth: 2, borderRightWidth: 2 },
	errorRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
	errorText: { color: colors.error, fontSize: typography.sizes.sm },
	btnRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
	halfBtn: {
		flex: 1,
		backgroundColor: colors.surfaceContainerLow,
		borderRadius: radius.xl,
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.15)",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: spacing.lg,
		gap: spacing.sm,
	},
	halfBtnText: { color: colors.onSurface, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
	capturedWrap: { width: "100%", aspectRatio: 1, borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.xl, position: "relative" },
	capturedImage: { width: "100%", height: "100%" },
	capturedBadge: {
		position: "absolute",
		bottom: spacing.base,
		right: spacing.base,
		backgroundColor: "rgba(1,3,51,0.7)",
		borderRadius: radius.full,
		padding: spacing.xs,
	},
	resultCard: {
		backgroundColor: colors.surfaceContainerLow,
		borderRadius: radius.xl,
		padding: spacing.xl,
		gap: spacing.base,
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.15)",
		marginBottom: spacing.xl,
		alignItems: "center",
	},
	resultStatus: { fontSize: typography.sizes.sm, fontWeight: typography.weights.black, letterSpacing: 1 },
	resultScore: { color: colors.onSurface, fontSize: typography.sizes["6xl"], fontWeight: typography.weights.black, letterSpacing: -2 },
	resultScoreLabel: { color: colors.outlineVariant, fontSize: typography.sizes.sm },
	resultMeta: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
	resultMetaLabel: { color: colors.outline, fontSize: typography.sizes.sm },
	resultMetaValue: { color: colors.onSurface, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
	retryBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.xl,
		backgroundColor: colors.surfaceContainerHigh,
		borderRadius: radius.full,
		marginTop: spacing.sm,
	},
	retryText: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
	// Camera view
	cameraGuide: { position: "absolute", top: "58%", left: 0, right: 0, alignItems: "center" },
	cameraGuideText: {
		color: colors.white,
		fontSize: typography.sizes.sm,
		fontWeight: typography.weights.semibold,
		backgroundColor: "rgba(1,3,51,0.65)",
		paddingHorizontal: spacing.base,
		paddingVertical: spacing.xs,
		borderRadius: radius.full,
	},
	shutterRow: { position: "absolute", bottom: 48, left: 0, right: 0, alignItems: "center", gap: spacing.base },
	shutter: {
		borderRadius: radius.full,
		overflow: "hidden",
		shadowColor: "#2642FF",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 20,
		elevation: 8,
	},
	shutterGradient: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
	cancelBtn: { paddingVertical: spacing.sm },
	cancelText: { color: colors.outlineVariant, fontSize: typography.sizes.sm },
});
