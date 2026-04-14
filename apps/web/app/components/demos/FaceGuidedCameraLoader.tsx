"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function CameraLoading() {
	const t = useTranslations("demos.common");
	return (
		<div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
			<span className="material-symbols-outlined animate-pulse text-4xl text-primary">photo_camera</span>
			<p className="text-sm text-on-surface-variant">{t("loadingCamera")}</p>
		</div>
	);
}

const FaceGuidedCameraLoader = dynamic(
	() => import("../FaceGuidedCamera").then((m) => m.FaceGuidedCamera),
	{
		ssr: false,
		loading: CameraLoading,
	},
);

export default FaceGuidedCameraLoader;
