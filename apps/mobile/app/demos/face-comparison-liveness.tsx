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
	Modal,
	Pressable,
	Switch,
	Linking,
	Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
	compareWithLiveness,
	DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR,
	DEFAULT_FACE_COMPARE_MIN_SCORE,
	parseCompareWithLivenessResult,
} from "@humanauthn/api-client";
import { colors, typography, spacing, radius, gradients } from "../../constants/tokens";
import { getMobileAuthSession } from "../../lib/authSession";

type Step = 1 | 2 | 3;

export default function FaceComparisonScreen() {
	const router = useRouter();
	const [permission, requestPermission] = useCameraPermissions();
	const [step, setStep] = useState<Step>(1);
	const [sourceUri, setSourceUri] = useState<string | null>(null);
	const [targetUri, setTargetUri] = useState<string | null>(null);
	const [sourceB64, setSourceB64] = useState("");
	const [targetB64, setTargetB64] = useState("");
	const [showCamera, setShowCamera] = useState(false);
	const [cameraFor, setCameraFor] = useState<"source" | "target">("source");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		match: boolean;
		confidence: number;
		livenessPct: number | null;
		livenessPassed: boolean;
		livenessMinScore: number;
		livenessSkipped: boolean;
	} | null>(null);
	const [livenessMinScore, setLivenessMinScore] = useState(DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR);
	const [cropFace, setCropFace] = useState(false);
	const [docsOpen, setDocsOpen] = useState(false);
	const cameraRef = useRef<CameraView>(null);

	const verified = (r: NonNullable<typeof result>) =>
		r.match && !r.livenessSkipped && r.livenessPassed;

	const adjustLiveness = (delta: number) => {
		setLivenessMinScore((v) => {
			const n = Math.round((v + delta) * 100) / 100;
			return Math.min(1, Math.max(0.52, n));
		});
	};

	const openCameraFor = async (target: "source" | "target") => {
		if (!permission?.granted) {
			const { granted } = await requestPermission();
			if (!granted) return;
		}
		setCameraFor(target);
		setShowCamera(true);
	};

	const capture = async () => {
		const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8, base64: true });
		if (!photo) return;
		setShowCamera(false);
		if (cameraFor === "source") {
			setSourceUri(photo.uri);
			setSourceB64(photo.base64 ?? "");
			setStep(2);
		} else {
			setTargetUri(photo.uri);
			setTargetB64(photo.base64 ?? "");
		}
	};

	const pickImage = async (target: "source" | "target") => {
		const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, base64: true });
		if (!res.canceled && res.assets[0]) {
			if (target === "source") {
				setSourceUri(res.assets[0].uri);
				setSourceB64(res.assets[0].base64 ?? "");
				setStep(2);
			} else {
				setTargetUri(res.assets[0].uri);
				setTargetB64(res.assets[0].base64 ?? "");
			}
		}
	};

	const analyze = async () => {
		const session = await getMobileAuthSession();

		if (!session?.accessToken) {
			Alert.alert("Sign in required", "Sign in from Home to run this demo.");
			return;
		}

		setLoading(true);
		setStep(3);
		try {
			const res = await compareWithLiveness(
				{
					gallery: [sourceB64],
					probe: targetB64,
					liveness_min_score: livenessMinScore,
					compare_min_score: DEFAULT_FACE_COMPARE_MIN_SCORE,
					...(cropFace ? { cropFace: true } : {}),
				},
				session.accessToken,
			);
			if (res.error) {
				Alert.alert("Comparison failed", res.error);
				setStep(2);
				setLoading(false);
				return;
			}
			const parsed = parseCompareWithLivenessResult(res.data);
			setResult({
				match: parsed.match,
				confidence: Math.round(parsed.score * 100),
				livenessPct: parsed.livenessSkipped
					? null
					: parsed.livenessScore != null
						? Math.round(parsed.livenessScore * 100)
						: null,
				livenessPassed: parsed.livenessPassed,
				livenessMinScore: parsed.livenessMinScore,
				livenessSkipped: parsed.livenessSkipped,
			});
		} catch (e: unknown) {
			Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
			setStep(2);
		}
		setLoading(false);
	};

	const reset = () => {
		setStep(1);
		setSourceUri(null);
		setTargetUri(null);
		setSourceB64("");
		setTargetB64("");
		setResult(null);
		setLivenessMinScore(DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR);
	};

	if (showCamera) {
		return (
			<View style={{ flex: 1 }}>
				<CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
					<TouchableOpacity style={styles.shutter} onPress={capture} activeOpacity={0.85}>
						<LinearGradient colors={gradients.primaryCta} style={styles.shutterGradient}>
							<Ionicons name="camera" size={28} color={colors.onPrimaryContainer} />
						</LinearGradient>
					</TouchableOpacity>
					<TouchableOpacity style={styles.cancelCamera} onPress={() => setShowCamera(false)}>
						<Text style={{ color: colors.onSurface }}>Cancel</Text>
					</TouchableOpacity>
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
						{(["SOURCE", "TARGET", "ANALYZE"] as const).map((label, i) => (
							<View key={label} style={styles.stepItem}>
								<View style={[styles.stepCircle, step > i + 1 && styles.stepDone, step === i + 1 && styles.stepActive]}>
									{step > i + 1 ? (
										<Ionicons name="checkmark" size={12} color={colors.white} />
									) : (
										<Text style={styles.stepNum}>{i + 1}</Text>
									)}
								</View>
								<Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>{label}</Text>
								{i < 2 && <View style={styles.stepLine} />}
							</View>
						))}
					</View>
					<TouchableOpacity onPress={() => setDocsOpen(true)} style={styles.docsBtn} accessibilityRole="button">
						<Ionicons name="book-outline" size={22} color={colors.primary} />
					</TouchableOpacity>
				</View>
			</SafeAreaView>

			<ScrollView contentContainerStyle={styles.scroll}>
				<Text style={styles.title}>Compare with liveness</Text>
				<Text style={styles.subtitle}>
					{step === 1
						? "Add the reference face (gallery). Compare runs first; liveness runs on the probe only if compare passes."
						: step === 2
							? "Add the probe image. Liveness runs only after the face score meets your compare threshold."
							: "Analyzing facial signatures…"}
				</Text>
				{step <= 2 && (
					<Text style={styles.hint}>
						Sequential flow: <Text style={styles.hintEm}>compare</Text> first, then <Text style={styles.hintEm}>liveness</Text> on the{" "}
						<Text style={styles.hintEm}>probe</Text> when the score is high enough. The <Text style={styles.hintEm}>gallery</Text> image is
						reference only.
					</Text>
				)}

				{/* Step 1 — Source */}
				{step >= 1 && (
					<View style={styles.imageRow}>
						<Text style={styles.imageLabel}>SOURCE · GALLERY (REFERENCE)</Text>
						{sourceUri ? (
							<View style={styles.imageCard}>
								<Image source={{ uri: sourceUri }} style={styles.faceImage} />
								{step === 1 && (
									<TouchableOpacity style={styles.changeBtn} onPress={() => setSourceUri(null)}>
										<Text style={styles.changeBtnText}>Change</Text>
									</TouchableOpacity>
								)}
							</View>
						) : (
							<View style={styles.uploadArea}>
								<View style={styles.uploadBtns}>
									<TouchableOpacity style={styles.halfBtn} onPress={() => openCameraFor("source")}>
										<Ionicons name="camera-outline" size={22} color={colors.primary} />
										<Text style={styles.halfBtnText}>Camera</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.halfBtn} onPress={() => pickImage("source")}>
										<Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
										<Text style={styles.halfBtnText}>Gallery</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>
				)}

				{/* Step 2 — Target */}
				{step >= 2 && (
					<View style={styles.imageRow}>
						<Text style={styles.imageLabel}>TARGET · PROBE (LIVENESS HERE)</Text>
						{targetUri ? (
							<View style={styles.imageCard}>
								<Image source={{ uri: targetUri }} style={styles.faceImage} />
							</View>
						) : (
							<View style={styles.uploadArea}>
								<View style={styles.uploadBtns}>
									<TouchableOpacity style={styles.halfBtn} onPress={() => openCameraFor("target")}>
										<Ionicons name="camera-outline" size={22} color={colors.primary} />
										<Text style={styles.halfBtnText}>Camera</Text>
									</TouchableOpacity>
									<TouchableOpacity style={styles.halfBtn} onPress={() => pickImage("target")}>
										<Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
										<Text style={styles.halfBtnText}>Gallery</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>
				)}

				{/* Options (step 2) */}
				{step === 2 && (
					<View style={styles.switchRow}>
						<Text style={styles.switchLabel}>Crop face (gallery URLs)</Text>
						<Switch value={cropFace} onValueChange={setCropFace} trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryContainer }} thumbColor={cropFace ? colors.primary : colors.outline} />
					</View>
				)}

				{/* Liveness threshold (step 2) */}
				{step === 2 && (
					<View style={styles.livenessRow}>
						<Text style={styles.livenessLabel}>LIVENESS MIN SCORE (PROBE)</Text>
						<Text style={styles.livenessHint}>
							Used only if compare passes. Default on the API is 0.6.
						</Text>
						<View style={styles.livenessStepper}>
							<TouchableOpacity style={styles.livenessBtn} onPress={() => adjustLiveness(-0.01)} accessibilityRole="button">
								<Text style={styles.livenessBtnText}>−</Text>
							</TouchableOpacity>
							<Text style={styles.livenessValue}>{livenessMinScore.toFixed(2)}</Text>
							<TouchableOpacity style={styles.livenessBtn} onPress={() => adjustLiveness(0.01)} accessibilityRole="button">
								<Text style={styles.livenessBtnText}>+</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Analyze CTA */}
				{step === 2 && targetUri && !loading && (
					<TouchableOpacity style={styles.analyzeBtn} onPress={analyze} activeOpacity={0.85}>
						<LinearGradient colors={gradients.primaryCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.analyzeGradient}>
							<Ionicons name="sync-outline" size={18} color={colors.onPrimaryContainer} />
							<Text style={styles.analyzeBtnText}>ANALYZE FACES</Text>
						</LinearGradient>
					</TouchableOpacity>
				)}

				{/* Processing */}
				{step === 3 && loading && (
					<View style={styles.processingBox}>
						<ActivityIndicator size="large" color={colors.primary} />
						<Text style={styles.processingText}>Comparing facial signatures…</Text>
					</View>
				)}

				{/* Result */}
				{step === 3 && !loading && result && (
					<View style={styles.resultCard}>
						<View style={styles.resultBadge}>
							<Ionicons
								name={verified(result) ? "checkmark-circle" : "alert-circle"}
								size={32}
								color={verified(result) ? "#4ade80" : colors.error}
							/>
							<Text
								style={[
									styles.resultStatus,
									{ color: verified(result) ? "#4ade80" : colors.error },
								]}
							>
								{verified(result)
									? "VERIFIED"
									: result.livenessSkipped
										? "COMPARE FAILED"
										: result.match && !result.livenessPassed
											? "LIVENESS BELOW MIN"
											: "FACE MISMATCH"}
							</Text>
						</View>
						<View style={styles.resultMetrics}>
							<View style={styles.resultMetric}>
								<Text style={styles.resultMetricValue}>{result.confidence}%</Text>
								<Text style={styles.resultMetricLabel}>
									Similarity (threshold {DEFAULT_FACE_COMPARE_MIN_SCORE})
								</Text>
							</View>
							<View style={styles.resultMetric}>
								<Text style={styles.resultMetricValue}>
									{result.livenessSkipped ? "N/A" : result.livenessPct != null ? `${result.livenessPct}%` : "—"}
								</Text>
								<Text style={styles.resultMetricLabel}>
									{result.livenessSkipped
										? "Liveness skipped (compare first)"
										: (
												<>
													Liveness (min {result.livenessMinScore.toFixed(2)})
													{result.livenessPct != null ? (
														<Text style={{ color: result.livenessPassed ? "#4ade80" : colors.error }}>
															{" "}
															{result.livenessPassed ? "· PASS" : "· FAIL"}
														</Text>
													) : null}
												</>
											)}
								</Text>
							</View>
						</View>
						<Text style={styles.resultSubline}>
							{result.livenessSkipped
								? "Compare did not meet the threshold — liveness was not evaluated (sequential flow)."
								: result.match
									? result.livenessPassed
										? "Face score passed and probe liveness met the minimum."
										: "Face score passed but probe liveness is below the minimum."
									: "Face similarity below compare threshold."}
						</Text>
						<TouchableOpacity style={styles.retryBtn} onPress={reset} activeOpacity={0.8}>
							<Ionicons name="refresh-outline" size={16} color={colors.primary} />
							<Text style={styles.retryText}>Compare Again</Text>
						</TouchableOpacity>
					</View>
				)}

				<View style={{ height: spacing["3xl"] }} />
			</ScrollView>

			<Modal visible={docsOpen} animationType="slide" transparent onRequestClose={() => setDocsOpen(false)}>
				<View style={styles.modalRoot}>
					<Pressable style={styles.modalBackdrop} onPress={() => setDocsOpen(false)} />
					<View style={styles.modalSheet}>
					<View style={styles.modalHandle} />
					<Text style={styles.modalTitle}>Compare with liveness</Text>
					<ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
						<Text style={styles.modalP}>
							Official docs:{" "}
							<Text style={styles.modalLink} onPress={() => Linking.openURL("https://docs.verifik.co/biometrics/compare-with-liveness/")}>
								docs.verifik.co/biometrics/compare-with-liveness
							</Text>
						</Text>
						<Text style={styles.modalSection}>Endpoint</Text>
						<Text style={styles.modalMono}>POST /v2/face-recognition/compare-with-liveness</Text>
						<Text style={styles.modalSection}>Headers</Text>
						<Text style={styles.modalP}>Content-Type: application/json{"\n"}Authorization: Bearer &lt;token&gt;</Text>
						<Text style={styles.modalSection}>Body params</Text>
						<Text style={styles.modalP}>
							probe (string, required) — Base64 or data URL of the face to verify.{"\n\n"}
							gallery (array, required) — Reference image(s), same encoding rules.{"\n\n"}
							liveness_min_score (optional) — Floor for liveness when compare passes; default 0.6 server-side.{"\n\n"}
							compare_min_score (optional) — Minimum face similarity to run liveness.{"\n\n"}
							cropFace (optional) — Crop faces when gallery entries are URLs.
						</Text>
						<Text style={styles.modalSection}>Notes</Text>
						<Text style={styles.modalP}>
							• Compare runs first; liveness runs on the probe only if the compare score meets your threshold.{"\n"}
							• If compare fails, the response may omit liveness.{"\n"}
							• Align defaults with your Verifik project settings.
						</Text>
					</ScrollView>
					<TouchableOpacity style={styles.modalClose} onPress={() => setDocsOpen(false)} activeOpacity={0.85}>
						<Text style={styles.modalCloseText}>Close</Text>
					</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.surface },
	header: { flexDirection: "row", alignItems: "center", paddingRight: spacing.sm },
	backBtn: { padding: spacing.base },
	docsBtn: { padding: spacing.base },
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
	stepLabel: { color: colors.outline, fontSize: 8, fontWeight: typography.weights.bold, letterSpacing: 0.5, textTransform: "uppercase" },
	stepLabelActive: { color: colors.primary },
	stepLine: { width: 16, height: 1, backgroundColor: "rgba(42,58,88,0.2)", marginHorizontal: 2 },
	scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.base, gap: spacing.xl },
	title: { color: colors.onSurface, fontSize: typography.sizes["3xl"], fontWeight: typography.weights.black, letterSpacing: -0.8 },
	subtitle: { color: colors.onSurfaceVariant, fontSize: typography.sizes.base },
	hint: {
		color: colors.outlineVariant,
		fontSize: typography.sizes.sm,
		lineHeight: typography.sizes.md * 1.4,
		marginTop: -spacing.md,
	},
	hintEm: { color: colors.primary, fontWeight: typography.weights.semibold },
	imageRow: { gap: spacing.sm },
	imageLabel: {
		color: colors.outline,
		fontSize: typography.sizes.xs,
		fontWeight: typography.weights.bold,
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	imageCard: { borderRadius: radius.xl, overflow: "hidden", position: "relative" },
	faceImage: { width: "100%", aspectRatio: 1, borderRadius: radius.xl },
	changeBtn: {
		position: "absolute",
		bottom: spacing.sm,
		right: spacing.sm,
		backgroundColor: "rgba(1,3,51,0.8)",
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		borderRadius: radius.full,
	},
	changeBtnText: { color: colors.primary, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
	uploadArea: {
		backgroundColor: colors.surfaceContainerLow,
		borderRadius: radius.xl,
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.15)",
		borderStyle: "dashed",
		padding: spacing.xl,
	},
	uploadBtns: { flexDirection: "row", gap: spacing.md },
	halfBtn: {
		flex: 1,
		backgroundColor: colors.surfaceContainerHigh,
		borderRadius: radius.lg,
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		padding: spacing.base,
	},
	halfBtnText: { color: colors.onSurface, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
	analyzeBtn: { borderRadius: radius.full, overflow: "hidden" },
	analyzeGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.base + 2 },
	analyzeBtnText: {
		color: colors.onPrimaryContainer,
		fontSize: typography.sizes.sm,
		fontWeight: typography.weights.black,
		letterSpacing: typography.tracking.wide,
	},
	processingBox: { alignItems: "center", gap: spacing.base, paddingVertical: spacing["3xl"] },
	processingText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.md },
	resultCard: {
		backgroundColor: colors.surfaceContainerLow,
		borderRadius: radius.xl,
		padding: spacing.xl,
		alignItems: "center",
		gap: spacing.md,
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.15)",
	},
	resultBadge: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	resultStatus: { fontSize: typography.sizes.sm, fontWeight: typography.weights.black, letterSpacing: 1 },
	resultScore: { color: colors.onSurface, fontSize: typography.sizes["6xl"], fontWeight: typography.weights.black, letterSpacing: -2 },
	resultScoreLabel: { color: colors.outlineVariant, fontSize: typography.sizes.sm },
	resultMetrics: { flexDirection: "row", gap: spacing.md, width: "100%", justifyContent: "center" },
	resultMetric: {
		flex: 1,
		backgroundColor: colors.surfaceContainerHigh,
		borderRadius: radius.lg,
		padding: spacing.base,
		alignItems: "center",
		gap: spacing.xs,
	},
	resultMetricValue: {
		color: colors.onSurface,
		fontSize: typography.sizes["3xl"],
		fontWeight: typography.weights.black,
		letterSpacing: -0.5,
	},
	resultMetricLabel: { color: colors.outlineVariant, fontSize: typography.sizes.xs, textAlign: "center" },
	resultSubline: {
		color: colors.outlineVariant,
		fontSize: typography.sizes.sm,
		textAlign: "center",
		lineHeight: typography.sizes.md * 1.35,
		paddingHorizontal: spacing.sm,
	},
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
	livenessRow: { gap: spacing.xs },
	livenessHint: {
		color: colors.outlineVariant,
		fontSize: typography.sizes.xs,
		lineHeight: typography.sizes.sm * 1.45,
		marginBottom: spacing.sm,
	},
	livenessLabel: {
		color: colors.outline,
		fontSize: typography.sizes.xs,
		fontWeight: typography.weights.bold,
		letterSpacing: 1,
	},
	livenessStepper: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.md,
	},
	livenessBtn: {
		width: 44,
		height: 44,
		borderRadius: radius.lg,
		backgroundColor: colors.surfaceContainerHigh,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.2)",
	},
	livenessBtnText: { color: colors.onSurface, fontSize: 22, fontWeight: typography.weights.bold },
	livenessValue: {
		color: colors.primary,
		fontSize: typography.sizes["2xl"],
		fontWeight: typography.weights.black,
		minWidth: 64,
		textAlign: "center",
	},
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: spacing.xs,
	},
	switchLabel: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm, flex: 1, paddingRight: spacing.md },
	modalRoot: { flex: 1, justifyContent: "flex-end" },
	modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(1,3,51,0.55)" },
	modalSheet: {
		left: 0,
		right: 0,
		maxHeight: "88%",
		backgroundColor: colors.surfaceContainerLow,
		borderTopLeftRadius: radius.xl,
		borderTopRightRadius: radius.xl,
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing["2xl"],
		borderWidth: 1,
		borderColor: "rgba(42,58,88,0.15)",
	},
	modalHandle: {
		alignSelf: "center",
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.outlineVariant,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
	},
	modalTitle: {
		color: colors.onSurface,
		fontSize: typography.sizes.lg,
		fontWeight: typography.weights.black,
		marginBottom: spacing.sm,
	},
	modalScroll: { maxHeight: 420 },
	modalScrollContent: { paddingBottom: spacing.md, gap: spacing.sm },
	modalSection: {
		color: colors.primary,
		fontSize: typography.sizes.xs,
		fontWeight: typography.weights.bold,
		letterSpacing: 0.8,
		marginTop: spacing.sm,
		textTransform: "uppercase",
	},
	modalP: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm, lineHeight: typography.sizes.md * 1.45 },
	modalMono: {
		color: colors.onSurface,
		fontSize: typography.sizes.xs,
		fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
		backgroundColor: colors.surfaceContainerHigh,
		padding: spacing.sm,
		borderRadius: radius.md,
	},
	modalLink: { color: colors.primary, textDecorationLine: "underline" },
	modalClose: {
		marginTop: spacing.md,
		alignItems: "center",
		paddingVertical: spacing.base,
		backgroundColor: colors.surfaceContainerHigh,
		borderRadius: radius.full,
	},
	modalCloseText: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
	shutter: { position: "absolute", bottom: 48, alignSelf: "center", borderRadius: radius.full, overflow: "hidden" },
	shutterGradient: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
	cancelCamera: { position: "absolute", bottom: 48, right: spacing.xl, padding: spacing.md },
});
