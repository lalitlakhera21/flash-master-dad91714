import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface State {
  error: Error | null;
}

/**
 * App-wide React error boundary. Catches render errors that would otherwise
 * leave the WebView in a frozen, blank state on Android. Offers a "Try again"
 * button that resets the boundary, plus a hard reload escape hatch.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      reportLovableError(error, { boundary: "AppErrorBoundary", info: info.componentStack });
    } catch {
      /* never throw from the error reporter */
    }
    // eslint-disable-next-line no-console
    console.error("AppErrorBoundary caught", error, info);
  }

  reset = () => this.setState({ error: null });

  hardReload = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-svh flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-extrabold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground break-words">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={this.reset}
              className="rounded-2xl gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-elegant"
            >
              Try again
            </button>
            <button
              onClick={this.hardReload}
              className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-bold"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    );
  }
}
