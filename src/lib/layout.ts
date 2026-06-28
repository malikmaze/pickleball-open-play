export type LayoutSize = "default" | "wide" | "full";

const sizeClasses: Record<LayoutSize, string> = {
  default: "max-w-3xl",
  wide: "max-w-6xl",
  full: "max-w-7xl",
};

/** Shared horizontal padding and max-width for page content and headers. */
export function layoutContainerClass(size: LayoutSize = "default"): string {
  return `mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeClasses[size]}`;
}

export const pageBottomPadding =
  "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8";
