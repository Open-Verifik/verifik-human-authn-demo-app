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
	icon: string;
	badge: string;
	title: string;
	description: string;
}

const traditionalDemos: DemoCard[] = [
	{
		id: "face-comparison",
		href: "/demos/face-comparison",
		icon: "face",
		badge: "Compare",
		title: "Face Comparison",
		description: "Upload two photos and see if they are the same person. Useful for onboarding and ID checks.",
	},
	{
		id: "face-comparison-liveness",
		href: "/demos/face-comparison-liveness",
		icon: "co_present",
		badge: "Sequential",
		title: "Compare with Liveness",
		description: "Match a reference photo to a live selfie. Liveness runs only after the face match looks strong enough.",
	},
	{
		id: "create-collection",
		href: "/demos/create-collection",
		icon: "folder_special",
		badge: "Collections",
		title: "Create Collection",
		description: "Create a named face collection to group enrolled persons for search and verification.",
	},
	{
		id: "create-person",
		href: "/demos/create-person",
		icon: "person_add",
		badge: "Enroll",
		title: "Create Person",
		description: "Enroll a new person by uploading face images and metadata. Stored in an OpenCV collection.",
	},
	{
		id: "create-person-with-liveness",
		href: "/demos/create-person-with-liveness",
		icon: "how_to_reg",
		badge: "Enroll + Live",
		title: "Create Person with Liveness",
		description: "Enroll a person while simultaneously running a liveness check and searching the collection for duplicates.",
	},
	{
		id: "search-person",
		href: "/demos/search-person",
		icon: "manage_search",
		badge: "1:N Search",
		title: "Search Person",
		description: "Upload one or more face images and search the collection for matching persons by similarity score.",
	},
	{
		id: "search-live-person",
		href: "/demos/search-live-person",
		icon: "search_hands_free",
		badge: "Live 1:N",
		title: "Search Live Person",
		description: "Capture a live face, run liveness detection, and search the collection for a match in one flow.",
	},
	{
		id: "search-active-user",
		href: "/demos/search-active-user",
		icon: "sensor_occupied",
		badge: "Active User",
		title: "Search Active User",
		description: "Authenticate an active user with a live face capture and return a liveness score alongside search results.",
	},
	{
		id: "detect-face",
		href: "/demos/detect-face",
		icon: "center_focus_weak",
		badge: "Detect",
		title: "Detect Face",
		description: "Submit an image and detect all faces it contains, returning bounding boxes and crop data.",
	},
	{
		id: "verify-face",
		href: "/demos/verify-face",
		icon: "verified",
		badge: "1:1 Verify",
		title: "Verify Face",
		description: "Verify a face image against a specific enrolled person by ID with a configurable similarity threshold.",
	},
	{
		id: "search-crops",
		href: "/demos/search-crops",
		icon: "crop_free",
		badge: "Crops",
		title: "Search Crops",
		description: "Run a multi-image crop search to find matching persons across uploaded face crops with precision tuning.",
	},
];

const humanAuthnDemos: DemoCard[] = [
	{
		id: "liveness",
		href: "/demos/liveness",
		icon: "verified_user",
		badge: "Anti-spoof",
		title: "Liveness Detection",
		description: "Show that a real person is in front of the camera, not a photo, mask, or replay.",
	},
	{
		id: "humanid-create",
		href: "/demos/humanid-create",
		icon: "fingerprint",
		badge: "Encrypt",
		title: "Create HumanID",
		description: "Bind public identity data and a face to an encrypted ZelfProof stored on IPFS. Recoverable only by the live face.",
	},
	{
		id: "humanid-create-qr",
		href: "/demos/humanid-create-qr",
		icon: "qr_code_2",
		badge: "QR",
		title: "Create HumanID QR",
		description: "Generate a QR-coded HumanID from a face capture and identity metadata for portable offline verification.",
	},
	{
		id: "humanid-decrypt",
		href: "/demos/humanid-decrypt",
		icon: "lock_open",
		badge: "Decrypt",
		title: "Decrypt HumanID",
		description: "Recover the identity data embedded in a ZelfProof by presenting the matching live face and the proof string.",
	},
	{
		id: "humanid-preview",
		href: "/demos/humanid-preview",
		icon: "preview",
		badge: "Preview",
		title: "Preview HumanID",
		description: "Inspect the public metadata inside a HumanID / ZelfProof string without requiring a face or credentials.",
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
								server-side OpenCV collection management and search. Decentralized HumanAuthn demos show how ZelfProof
								binds identity data to a live face with no central database.
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
					<DemoGrid demos={traditionalDemos} />
				</section>

				{/* ── Decentralized Biometrics ──────────────────────── */}
				<section className="mb-20 animate-slide-up">
					<div className="flex items-end gap-4 mb-8">
						<div>
							<p className="text-primary text-[0.6875rem] font-bold tracking-widest uppercase mb-1">ZelfProof · Decentralized identity</p>
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
					className="group relative overflow-hidden rounded-2xl border border-frost bg-transparent p-6
                         transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.02] hover:shadow-ring-frost
                         flex flex-col justify-between min-h-[240px]"
				>
					{/* Card header */}
					<div className="flex justify-between items-start mb-8">
						<div className="p-2.5 rounded-lg border border-frost bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
							<span className="material-symbols-outlined text-xl leading-none block">{demo.icon}</span>
						</div>
						<span className="text-[10px] font-medium text-on-surface-variant border border-frost rounded-full px-2.5 py-1">
							{demo.badge}
						</span>
					</div>

					{/* Card body */}
					<div>
						<h3 className="text-lg font-semibold text-on-surface mb-3 tracking-tight">{demo.title}</h3>
						<p className="text-on-surface-variant text-sm leading-relaxed mb-6">{demo.description}</p>
						<div className="flex items-center text-primary text-sm font-medium gap-1.5 group-hover:gap-2 transition-all">
							Run demo
							<span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}
