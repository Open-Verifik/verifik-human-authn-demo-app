import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "demos.faceDetection" });
	return {
		title: t("metaTitle"),
		description: t("metaDescription"),
	};
}

/** Legacy path; real demo lives at `/demos/detect-face` with guided capture. */
export default async function FaceDetectionPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	redirect({ href: "/demos/detect-face", locale });
}
