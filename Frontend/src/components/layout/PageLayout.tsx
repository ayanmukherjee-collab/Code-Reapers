import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface PageLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
}

export function PageLayout({ children, showNav = true, className = "" }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <main className={showNav ? "pb-28" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}


