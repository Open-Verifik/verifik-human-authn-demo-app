import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { compareFaces, DEFAULT_FACE_COMPARE_MIN_SCORE, parseFaceCompareResult } from "@humanauthn/api-client";
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
	const [result, setResult] = useState<{ match: boolean; confidence: number } | null>(null);
	const cameraRef = useRef<CameraView>(null);

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
			const res = await compareFaces(
				{
					gallery: [sourceB64],
					probe: [targetB64],
					compare_min_score: DEFAULT_FACE_COMPARE_MIN_SCORE,
				},
				session.accessToken,
			);
			if (res.error) {
				Alert.alert("Comparison failed", res.error);
				setStep(2);
				setLoading(false);
				return;
			}
			const parsed = parseFaceCompareResult(res.data);
			setResult({
				match: parsed.match,
				confidence: Math.round(parsed.score * 100),
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
				</View>
			</SafeAreaView>

			<ScrollView contentContainerStyle={styles.scroll}>
				<Text style={styles.title}>Face Comparison</Text>
				<Text style={styles.subtitle}>
					{step === 1
						? "Provide a source facial image to begin."
						: step === 2
							? "Now provide the target image to compare."
							: "Analyzing facial signatures…"}
				</Text>

				{/* Step 1 — Source */}
				{step >= 1 && (
					<View style={styles.imageRow}>
						<Text style={styles.imageLabel}>SOURCE</Text>
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
						<Text style={styles.imageLabel}>TARGET</Text>
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
								name={result.match ? "checkmark-circle" : "close-circle"}
								size={32}
								color={result.match ? "#4ade80" : colors.error}
							/>
							<Text style={[styles.resultStatus, { color: result.match ? "#4ade80" : colors.error }]}>
								{result.match ? "SAME PERSON" : "DIFFERENT PERSON"}
							</Text>
						</View>
						<Text style={styles.resultScore}>{result.confidence}%</Text>
						<Text style={styles.resultScoreLabel}>Similarity Score</Text>
						<TouchableOpacity style={styles.retryBtn} onPress={reset} activeOpacity={0.8}>
							<Ionicons name="refresh-outline" size={16} color={colors.primary} />
							<Text style={styles.retryText}>Compare Again</Text>
						</TouchableOpacity>
					</View>
				)}

				<View style={{ height: spacing["3xl"] }} />
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.surface },
	header: { flexDirection: "row", alignItems: "center", paddingRight: spacing.base },
	backBtn: { padding: spacing.base },
	stepper: { flex: 1, flexDirection: "row", alignItems: "center" },
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
	shutter: { position: "absolute", bottom: 48, alignSelf: "center", borderRadius: radius.full, overflow: "hidden" },
	shutterGradient: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
	cancelCamera: { position: "absolute", bottom: 48, right: spacing.xl, padding: spacing.md },
});
