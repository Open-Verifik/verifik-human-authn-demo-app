import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { detectLiveness, parseLivenessResult, type LivenessParsed } from "@humanauthn/api-client";
import { colors, typography, spacing, radius } from "../../constants/tokens";
import { getMobileAuthSession } from "../../lib/authSession";

export default function FaceDetectionScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<LivenessParsed | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <SafeAreaView edges={["top"]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
                    </TouchableOpacity>
                </SafeAreaView>
                <View style={styles.content}>
                    <Ionicons name="camera-outline" size={48} color={colors.outline} style={{ marginBottom: spacing.md }} />
                    <Text style={styles.title}>Camera Access</Text>
                    <Text style={styles.subtitle}>We need access to your camera to demonstrate liveness detection.</Text>
                    <TouchableOpacity style={styles.ctaBtn} onPress={requestPermission}>
                        <Text style={styles.ctaText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const takePictureAndAnalyze = async () => {
        if (!cameraRef.current) return;
        try {
            setLoading(true);
            const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
            if (!photo?.base64) throw new Error("Failed to capture image");

            setCapturedImage(photo.uri);

            const session = await getMobileAuthSession();
            if (!session?.accessToken) {
                Alert.alert("Sign in required", "Sign in from Home to run this demo.");
                setCapturedImage(null);
                return;
            }

            const os = Platform.OS === "ios" ? "IOS" : "ANDROID";
            const res = await detectLiveness({ os, image: photo.base64 }, session.accessToken);

            if (res.error) {
                Alert.alert("Detection Failed", res.error);
                setCapturedImage(null);
            } else {
                setResult(parseLivenessResult(res.data));
            }
        } catch (err: any) {
            Alert.alert("Error", err.message);
            setCapturedImage(null);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setCapturedImage(null);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={["top"]} style={result ? styles.safeAreaResult : styles.safeAreaCamera}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={result ? colors.onSurface : colors.white} />
                </TouchableOpacity>
            </SafeAreaView>

            {!capturedImage ? (
                <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} facing="front" ref={cameraRef} animateShutter={false}>
                        <View style={styles.overlay}>
                            <View style={styles.scanBox} />
                            <Text style={styles.overlayText}>Position your face in the center</Text>

                            <View style={styles.captureControls}>
                                <TouchableOpacity
                                    style={[styles.captureBtn, loading && styles.captureBtnDisabled]}
                                    onPress={takePictureAndAnalyze}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color={colors.primary} size="large" /> : <View style={styles.captureInner} />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </CameraView>
                </View>
            ) : (
                <View style={styles.resultContainer}>
                    <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="cover" />

                    <View style={styles.resultCard}>
                        {loading ? (
                            <View style={{ alignItems: "center", padding: spacing.xl }}>
                                <ActivityIndicator color={colors.primary} size="large" />
                                <Text style={{ color: colors.onSurface, marginTop: spacing.md }}>Analyzing Biometrics...</Text>
                            </View>
                        ) : result ? (
                            <View>
                                <View style={[styles.statusBadge, result.passed ? styles.statusPass : styles.statusFail]}>
                                    <Ionicons name={result.passed ? "shield-checkmark" : "warning"} size={20} color={colors.white} />
                                    <Text style={styles.statusText}>{result.passed ? "LIVENESS VERIFIED" : "LIVENESS FAILED"}</Text>
                                </View>

                                {!!result.message && <Text style={styles.detailText}>{result.message}</Text>}

                                <View style={styles.metaBox}>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>Liveness score</Text>
                                        <Text style={styles.metaValue}>
                                            {result.livenessScore != null ? `${Math.round(result.livenessScore * 100)}%` : "—"}
                                        </Text>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>Min score</Text>
                                        <Text style={styles.metaValue}>{Math.round(result.minScore * 100)}%</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                                    <Text style={styles.resetText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    safeAreaCamera: { position: "absolute", top: 0, zIndex: 10, width: "100%", backgroundColor: "transparent" },
    safeAreaResult: { backgroundColor: colors.surfaceContainerLow },
    backBtn: { padding: spacing.base, marginLeft: spacing.sm },
    content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing["3xl"], gap: spacing.lg },
    title: { color: colors.onSurface, fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, textAlign: "center" },
    subtitle: { color: colors.onSurfaceVariant, fontSize: typography.sizes.md, textAlign: "center", lineHeight: 22 },
    ctaBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full },
    ctaText: { color: colors.onPrimary, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },

    cameraContainer: { flex: 1, backgroundColor: "black" },
    camera: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 60,
        paddingTop: 100,
    },
    scanBox: {
        width: 280,
        height: 380,
        borderRadius: 160,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: "transparent",
        marginTop: 40,
    },
    overlayText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginTop: spacing.xl },
    captureControls: { width: "100%", alignItems: "center", marginBottom: spacing["2xl"] },
    captureBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "rgba(255,255,255,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    captureBtnDisabled: { opacity: 0.5 },
    captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white },

    resultContainer: { flex: 1, backgroundColor: colors.surfaceContainerLow },
    previewImage: { width: "100%", height: "50%", backgroundColor: "black" },
    resultCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        marginTop: -20,
        padding: spacing.xl,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
    },
    statusPass: { backgroundColor: colors.success },
    statusFail: { backgroundColor: colors.error },
    statusText: { color: colors.white, fontWeight: typography.weights.black, fontSize: typography.sizes.md, letterSpacing: 1 },
    detailText: { color: colors.onSurfaceVariant, textAlign: "center", marginBottom: spacing.xl, fontSize: typography.sizes.sm },
    metaBox: { gap: spacing.base, marginBottom: spacing["2xl"] },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(42,58,88,0.1)",
    },
    metaLabel: { color: colors.outline, fontSize: typography.sizes.md },
    metaValue: { color: colors.onSurface, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
    resetBtn: {
        backgroundColor: colors.surfaceContainerHigh,
        paddingVertical: spacing.base,
        borderRadius: radius.full,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(42,58,88,0.2)",
    },
    resetText: { color: colors.primary, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
});
