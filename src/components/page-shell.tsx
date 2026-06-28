import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  withNav?: boolean;
}

export function PageShell({
  children,
  className,
  withNav = true,
}: PageShellProps) {
  return (
    <div className="halftone-bg min-h-screen">
      {withNav && (
        <Suspense fallback={null}>
          <DesktopNav />
        </Suspense>
      )}
      <main
        className={cn(
          "mx-auto min-h-screen max-w-3xl px-4",
          withNav && "pb-24 md:pb-8",
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
