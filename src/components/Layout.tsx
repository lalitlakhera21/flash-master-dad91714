import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-start gap-3 mb-6 animate-fade-up">
      {back && (
        <Link
          to={back}
          className="shrink-0 w-10 h-10 rounded-2xl glass flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-32 min-h-screen">
      {children}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-up">
      <div className="text-6xl mb-4 animate-pop-in">{emoji}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
