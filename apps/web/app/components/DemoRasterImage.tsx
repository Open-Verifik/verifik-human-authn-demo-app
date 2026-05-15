"use client";

import Image from "next/image";
import clsx from "clsx";
import type { ComponentProps } from "react";

const DEFAULT = 800;

export type DemoRasterImageProps = {
	src: string;
	alt: string;
	className?: string;
	/** Parent must be `relative` with explicit dimensions (or `aspect-*` + width). */
	fill?: boolean;
	sizes?: string;
} & Omit<ComponentProps<typeof Image>, "src" | "alt" | "unoptimized">;

/**
 * `next/image` with `unoptimized` for demo data URLs, API URLs, and blobs (no remotePatterns churn).
 */
export function DemoRasterImage({
	src,
	alt,
	className,
	fill,
	sizes = "100vw",
	width = DEFAULT,
	height = DEFAULT,
	...rest
}: DemoRasterImageProps) {
	if (fill) {
		return (
			<Image
				src={src}
				alt={alt}
				fill
				unoptimized
				sizes={sizes}
				className={clsx(className)}
				{...rest}
			/>
		);
	}
	return (
		<Image
			src={src}
			alt={alt}
			width={width}
			height={height}
			unoptimized
			className={className}
			{...rest}
		/>
	);
}
