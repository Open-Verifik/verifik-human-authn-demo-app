"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
	React.ElementRef<typeof CheckboxPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
	<CheckboxPrimitive.Root
		ref={ref}
		className={cn(
			"peer h-5 w-5 shrink-0 rounded-md border border-outline-variant/80 bg-surface-container-high shadow-sm",
			"transition-colors duration-150",
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"data-[state=checked]:border-primary-container data-[state=checked]:bg-primary-container data-[state=checked]:text-on-primary-container",
			"hover:border-outline data-[state=unchecked]:hover:bg-surface-container",
			className,
		)}
		{...props}
	>
		<CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
			<Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
		</CheckboxPrimitive.Indicator>
	</CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
