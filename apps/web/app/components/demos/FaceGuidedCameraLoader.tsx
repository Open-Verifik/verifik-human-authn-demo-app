"use client";

import dynamic from "next/dynamic";

const FaceGuidedCameraLoader = dynamic(
	() => import("../FaceGuidedCamera").then((m) => m.FaceGuidedCamera),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
				<span className="material-symbols-outlined animate-pulse text-4xl text-primary">photo_camera</span>
				<p className="text-sm text-on-surface-variant">Loading camera…</p>
			</div>
		),
	},
);

export default FaceGuidedCameraLoader;
