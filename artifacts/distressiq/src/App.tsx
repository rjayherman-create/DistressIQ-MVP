import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useAuth } from "@workspace/replit-auth-web";
import { TrendingDown, Lock } from "lucide-react";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LoginGate() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-slate-50 to-white px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-bold tracking-widest text-white uppercase">DistressIQ MVP</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Pre-delisting opportunity<br className="hidden sm:block" /> intelligence.
          </h1>
          <p className="max-w-md text-base text-slate-500">
            Rank sub-$2 distressed NASDAQ stocks by bounce probability, delisting risk, operator quality, and tradability.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-100">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Lock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">This app is private</p>
              <p className="mt-1 text-sm text-slate-500">Sign in to access the scanner, stock detail view, and trade plans.</p>
            </div>
            <button
              onClick={login}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 active:scale-95"
            >
              Log in to continue
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">Access is restricted to authorized users only.</p>
      </div>
    );
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoginGate />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
