import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Face Detection Demo",
	description: "Detect faces via Verifik HumanAuthn API (same demo as Detect Face).",
};

/** Legacy path; real demo lives at `/demos/detect-face` with guided capture. */
export default function FaceDetectionPage() {
	redirect("/demos/detect-face");
}
