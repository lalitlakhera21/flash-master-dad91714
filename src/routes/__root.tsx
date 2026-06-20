import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BottomNav } from "../components/BottomNav";
import { useStore } from "../lib/store";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🧭</div>
        <h1 className="text-3xl font-bold">Lost in the deck</h1>
        <p className="mt-2 text-sm text-muted-foreground">This card doesn't exist yet.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-2xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant">
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-2xl gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >Try again</button>
          <a href="/" className="rounded-2xl border border-input bg-background px-4 py-2 text-sm font-semibold">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#4F46E5" },
      { title: "FlashMaster — Learn faster with smart flashcards" },
      { name: "description", content: "Premium flashcard app for students. Build decks, study smart, take quizzes, track your streak." },
      { property: "og:title", content: "FlashMaster — Learn faster with smart flashcards" },
      { property: "og:description", content: "Premium flashcard app for students. Build decks, study smart, take quizzes, track your streak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FlashMaster — Learn faster with smart flashcards" },
      { name: "twitter:description", content: "Premium flashcard app for students. Build decks, study smart, take quizzes, track your streak." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/05090b94-0370-44fa-99f1-ad36a998cd91" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/05090b94-0370-44fa-99f1-ad36a998cd91" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeManager() {
  const decksCount = useStore((s) => s.decks.length);
  const cardsCount = useStore((s) => s.cards.length);
  const loadSampleData = useStore((s) => s.loadSampleData);
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    if (decksCount === 0 && cardsCount === 0) loadSampleData();
  }, [decksCount, cardsCount, loadSampleData]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeManager />
      <Outlet />
      <BottomNav />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
