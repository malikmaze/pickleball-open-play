export type LayoutSize = "default" | "wide" | "full" | "fluid";

const sizeClasses: Record<LayoutSize, string> = {
  default: "max-w-3xl",
  wide: "max-w-6xl",
  full: "max-w-7xl",
  /** Courts / live floor — uses more of laptop and desktop width */
  fluid: "max-w-[min(100%,96rem)]",
};

/** Shared horizontal padding and max-width for page content and headers. */
export function layoutContainerClass(size: LayoutSize = "default"): string {
  return `mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeClasses[size]}`;
}

export const pageBottomPadding =
  "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8";

/** Horizontal inset for session admin chrome + tab bodies (aligned). */
export const adminSessionPadding = "px-3 sm:px-4 lg:px-5";

/** Session admin chrome + tab bodies — full width within the page shell. */
export const adminSessionWidth = `w-full ${adminSessionPadding}`;

/** Space between sticky tabs and tab content on all session admin pages. */
export const adminSessionBodyGap = "pt-4 sm:pt-5";

/** Minimal vertical padding for admin header rows (logo / actions). */
export const adminSessionHeaderPy = "py-2";

/** @deprecated Use adminSessionWidth */
export const adminTabWidth = adminSessionWidth;

/** Settings forms — compact column inside full-width tabs. */
export const adminFormWidth = "w-full max-w-2xl";

/** Typical single-line field caps (use with w-full). */
export const fieldWidthXs = "w-full max-w-[9rem]";
export const fieldWidthSm = "w-full max-w-[11rem]";
export const fieldWidthMd = "w-full max-w-xs";
export const fieldWidthLg = "w-full max-w-sm";
export const fieldWidthXl = "w-full max-w-md";
export const fieldWidth2xl = "w-full max-w-lg";
