import type { Metadata } from "next";
import Link from "next/link";
import HomeHeader from "./HomeHeader";

export const metadata: Metadata = {
	title: "Demo Dashboard",
	description:
		"Authentication anchored to human presence. Run Verifik's live biometric demos for face match, liveness, and HumanID in the browser.",
};

interface DemoCard {
	id: string;
	href: string;
	/** Material Symbols icon name (traditional demos). */
	icon?: string;
	/** Step index (HumanAuthn demos): shown instead of an icon. */
	stepNumber?: number;
	/** Top-right pill: HumanAuthn short tags; traditional uses sub-category (Search, Enroll, Comparison, Detection). */
	badge: string;
	title: string;
	description: string;
}

type TraditionalSection = {
	id: string;
	label: string;
	demos: DemoCard[];
};

/** OpenCV demos grouped by sub-category; `badge` on each card matches the category pill. Step numbers 1–11 follow section order on the page. */
const traditionalSections: TraditionalSection[] = [
	{
		id: "enroll",
		label: "Enroll",
		demos: [
			{
				id: "create-collection",
				href: "/demos/create-collection",
				stepNumber: 1,
				badge: "Enroll",
				title: "Create Collection",
				description: "Create a named face collection to group enrolled persons for search and verification.",
			},
			{
				id: "create-person",
				href: "/demos/create-person",
				stepNumber: 2,
				badge: "Enroll",
				title: "Create Person",
				description: "Enroll a new person by uploading face images and metadata. Stored in an OpenCV collection.",
			},
			{
				id: "create-person-with-liveness",
				href: "/demos/create-person-with-liveness",
				stepNumber: 3,
				badge: "Enroll",
				title: "Create Person with Liveness",
				description: "Enroll a person while simultaneously running a liveness check and searching the collection for duplicates.",
			},
		],
	},
	{
		id: "search",
		label: "Search",
		demos: [
			{
				id: "search-person",
				href: "/demos/search-person",
				stepNumber: 4,
				badge: "Search",
				title: "Search Person",
				description: "Upload one or more face images and search the collection for matching persons by similarity score.",
			},
			{
				id: "search-live-person",
				href: "/demos/search-live-person",
				stepNumber: 5,
				badge: "Search",
				title: "Search Live Person",
				description: "Capture a live face, run liveness detection, and search the collection for a match in one flow.",
			},
			{
				id: "search-active-user",
				href: "/demos/search-active-user",
				stepNumber: 6,
				badge: "Search",
				title: "Search Active User",
				description: "Authenticate an active user with a live face capture and return a liveness score alongside search results.",
			},
		],
	},
	{
		id: "detection",
		label: "Detection",
		demos: [
			{
				id: "detect-face",
				href: "/demos/detect-face",
				stepNumber: 7,
				badge: "Detection",
				title: "Detect Face",
				description: "Submit an image and detect all faces it contains, returning bounding boxes and crop data.",
			},
			{
				id: "search-crops",
				href: "/demos/search-crops",
				stepNumber: 8,
				badge: "Detection",
				title: "Search Crops",
				description: "Run a multi-image crop search to find matching persons across uploaded face crops with precision tuning.",
			},
		],
	},
	{
		id: "comparison",
		label: "Comparison",
		demos: [
			{
				id: "face-comparison",
				href: "/demos/face-comparison",
				stepNumber: 9,
				badge: "Comparison",
				title: "Face Comparison",
				description: "Upload two photos and see if they are the same person. Useful for onboarding and ID checks.",
			},
			{
				id: "face-comparison-liveness",
				href: "/demos/face-comparison-liveness",
				stepNumber: 10,
				badge: "Comparison",
				title: "Compare with Liveness",
				description: "Match a reference photo to a live selfie. Liveness runs only after the face match looks strong enough.",
			},
			{
				id: "verify-face",
				href: "/demos/verify-face",
				stepNumber: 11,
				badge: "Comparison",
				title: "Verify Face",
				description: "Verify a face image against a specific enrolled person by ID with a configurable similarity threshold.",
			},
		],
	},
];

const humanAuthnDemos: DemoCard[] = [
	{
		id: "liveness",
		href: "/demos/liveness",
		stepNumber: 1,
		badge: "Anti-spoof",
		title: "Liveness Detection",
		description: "Show that a real person is in front of the camera, not a photo, mask, or replay.",
	},
	{
		id: "humanid-create",
		href: "/demos/humanid-create",
		stepNumber: 2,
		badge: "Encrypt",
		title: "Create HumanID",
		description: "Bind public identity data and a face to an encrypted HumanID proof stored on IPFS. Recoverable only by the live face.",
	},
	{
		id: "humanid-create-qr",
		href: "/demos/humanid-create-qr",
		stepNumber: 3,
		badge: "QR",
		title: "Create HumanID QR",
		description: "Generate a QR-coded HumanID from a face capture and identity metadata for portable offline verification.",
	},
	{
		id: "humanid-decrypt",
		href: "/demos/humanid-decrypt",
		stepNumber: 4,
		badge: "Decrypt",
		title: "Decrypt HumanID",
		description: "Recover the identity data in a HumanID by presenting the matching live face and the proof string.",
	},
	{
		id: "humanid-preview",
		href: "/demos/humanid-preview",
		stepNumber: 5,
		badge: "Preview",
		title: "Preview HumanID",
		description: "Inspect the public metadata inside a HumanID string without a face image or extra credentials.",
	},
];

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen bg-surface">
			<HomeHeader />

			{/* ── Main Content ─────────────────────────────────────── */}
			<main className="flex-grow pt-32 pb-40 px-6 max-w-6xl mx-auto w-full">
				{/* Hero Section */}
				<section className="mb-24 animate-fade-in">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
						<div className="max-w-2xl">
							<p className="text-primary text-[0.75rem] font-semibold tracking-widest uppercase mb-6">
								Biometrics · Live demos
							</p>
							<h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-8 leading-[1.05]">
								HumanAuthn · Enterprise grade biometrics
							</h1>
							<p className="text-on-surface-variant text-lg leading-relaxed max-w-xl">
								Run face match, liveness, HumanID, and live detection in the browser. Traditional biometrics cover
								server-side OpenCV collection management and search. Decentralized HumanAuthn demos show how a HumanID
								binds identity data to a live face without a central face database.
							</p>
						</div>

						{/* Visual anchor */}
						<div className="hidden md:flex relative flex-shrink-0">
							<div className="relative p-6 rounded-2xl border border-frost bg-white/[0.01] shadow-ambient">
								<span
									className="material-symbols-outlined text-primary text-4xl opacity-80"
									style={{ fontVariationSettings: "'FILL' 0" }}
								>
									shield_person
								</span>
							</div>
						</div>
					</div>
				</section>

				{/* ── Traditional Biometrics ────────────────────────── */}
				<section className="mb-20 animate-slide-up">
					<div className="flex items-end gap-4 mb-8">
						<div>
							<p className="text-primary text-[0.6875rem] font-bold tracking-widest uppercase mb-1">OpenCV · Server-side gallery</p>
							<h2 className="text-2xl font-bold tracking-tight text-on-surface">Traditional Biometrics</h2>
						</div>
					</div>
					<div className="space-y-14">
						{traditionalSections.map((section) => (
							<div key={section.id}>
								<h3 className="text-xs font-bold tracking-widest uppercase text-primary mb-4">{section.label}</h3>
								<DemoGrid demos={section.demos} />
							</div>
						))}
					</div>
				</section>

				{/* ── Decentralized Biometrics ──────────────────────── */}
				<section className="mb-20 animate-slide-up">
					<div className="flex items-end gap-4 mb-8">
						<div>
							<p className="text-primary text-[0.6875rem] font-bold tracking-widest uppercase mb-1">HumanAuthn · HumanID</p>
							<h2 className="text-2xl font-bold tracking-tight text-on-surface">Decentralized Biometrics · HumanAuthn</h2>
						</div>
					</div>
					<DemoGrid demos={humanAuthnDemos} />
				</section>

				{/* ── Enterprise Banner ─────────────────────────────── */}
				<section className="mt-16 rounded-3xl border border-frost bg-transparent overflow-hidden relative min-h-[340px] flex items-center shadow-ambient">
					{/* Subtle background glow */}
					<div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-60" />
					<div className="absolute inset-0 blueprint-grid opacity-[0.15]" />

					<div className="relative z-10 p-10 md:p-16 max-w-2xl">
						<p className="text-primary text-[0.75rem] font-semibold tracking-widest uppercase mb-4">Verifik Platform</p>
						<h2 className="text-4xl font-bold tracking-tight text-white mb-6">Enterprise Grade Security</h2>
						<p className="text-on-surface-variant text-lg leading-relaxed mb-10">
							Our platform processes biometric data with end-to-end encryption. Privacy by design, ready for serious deployments.
						</p>
						<div className="flex flex-wrap gap-4">
							<div className="border border-frost bg-white/[0.02] px-4 py-2 rounded-full flex items-center gap-2">
								<span className="material-symbols-outlined text-primary text-base leading-none">verified</span>
								<span className="text-[0.6875rem] font-semibold tracking-wider uppercase text-on-surface-variant">
									GDPR Compliant
								</span>
							</div>
							<div className="border border-frost bg-white/[0.02] px-4 py-2 rounded-full flex items-center gap-2">
								<span className="material-symbols-outlined text-primary text-base leading-none">lock</span>
								<span className="text-[0.6875rem] font-semibold tracking-wider uppercase text-on-surface-variant">AES-256</span>
							</div>
							<div className="border border-frost bg-white/[0.02] px-4 py-2 rounded-full flex items-center gap-2">
								<span className="material-symbols-outlined text-primary text-base leading-none">shield</span>
								<span className="text-[0.6875rem] font-semibold tracking-wider uppercase text-on-surface-variant">SOC 2 Ready</span>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* ── Mobile Bottom Nav ────────────────────────────────── */}
			<nav
				className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center
                      px-4 pb-safe bg-surface/90 backdrop-blur-xl z-50 border-t border-frost"
			>
				<Link
					href="/home"
					id="nav-identity"
					className="flex flex-col items-center justify-center text-primary pt-4 pb-2 flex-1 active:scale-95 duration-150 relative"
				>
					<div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full"></div>
					<span className="material-symbols-outlined mb-1">face</span>
					<span className="text-[10px] font-medium tracking-wide">Identity</span>
				</Link>
				<Link
					href="/home"
					id="nav-security"
					className="flex flex-col items-center justify-center text-outline-variant pt-4 pb-2 flex-1 active:scale-95 duration-150 hover:text-primary transition-all"
				>
					<span className="material-symbols-outlined mb-1">verified_user</span>
					<span className="text-[10px] font-medium tracking-wide">Security</span>
				</Link>
				<Link
					href="/home"
					id="nav-settings"
					className="flex flex-col items-center justify-center text-outline-variant pt-4 pb-2 flex-1 active:scale-95 duration-150 hover:text-primary transition-all"
				>
					<span className="material-symbols-outlined mb-1">settings</span>
					<span className="text-[10px] font-medium tracking-wide">Settings</span>
				</Link>
			</nav>
		</div>
	);
}

function DemoGrid({ demos }: { demos: DemoCard[] }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{demos.map((demo) => (
				<Link
					key={demo.id}
					href={demo.href}
					id={`demo-card-${demo.id}`}
					className="group relative flex min-h-[240px] w-full flex-col items-stretch text-left overflow-hidden rounded-2xl border border-frost bg-transparent p-6
                         transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.02] hover:shadow-ring-frost"
				>
					{/* Icon + badge row */}
					<div className="mb-5 flex w-full shrink-0 justify-between items-start">
						{demo.stepNumber != null ? (
							<div
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-frost bg-primary/5 text-lg font-bold tabular-nums leading-none text-primary group-hover:bg-primary/10 transition-colors"
								aria-hidden
							>
								{demo.stepNumber}
							</div>
						) : (
							<div className="p-2.5 rounded-lg border border-frost bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
								<span className="material-symbols-outlined text-xl leading-none block">{demo.icon}</span>
							</div>
						)}
						<span className="text-[10px] font-medium text-on-surface-variant border border-frost rounded-full px-2.5 py-1">
							{demo.badge}
						</span>
					</div>

					{/* Title + description: stay under the header, top-aligned; flex-1 absorbs extra height */}
					<div className="flex min-h-0 flex-1 flex-col items-start text-left">
						<h3 className="text-lg font-semibold text-on-surface mb-3 tracking-tight">{demo.title}</h3>
						<p className="text-on-surface-variant text-sm leading-relaxed">{demo.description}</p>
					</div>

					{/* CTA pinned to card bottom */}
					<div className="mt-auto flex w-full shrink-0 items-center justify-start pt-6 text-primary text-sm font-medium gap-1.5 group-hover:gap-2 transition-all">
						Run demo
						<span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
					</div>
				</Link>
			))}
		</div>
	);
}
