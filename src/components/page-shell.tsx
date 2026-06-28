import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import { layoutContainerClass, pageBottomPadding, type LayoutSize } from "@/lib/layout";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  withNav?: boolean;
  size?: LayoutSize;
}

export function PageShell({
  children,
  className,
  withNav = true,
  size = "default",
}: PageShellProps) {
  return (
    <div className="halftone-bg min-h-screen min-h-[100dvh]">
      {withNav && (
        <Suspense fallback={null}>
          <DesktopNav />
        </Suspense>
      )}
      <main
        className={cn(
          layoutContainerClass(size),
          "min-h-screen min-h-[100dvh]",
          withNav && pageBottomPadding,
          className
        )}
      >
        {children}
      </main>
      {withNav && (
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      )}
    </div>
  );
}
