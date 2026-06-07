import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { RouterProvider, useRoute } from "@/lib/router";
import { Layout } from "@/components/Layout";
import { MatchDetailModal } from "@/components/MatchDetailModal";
import { Dashboard } from "@/pages/Dashboard";
import { Matches } from "@/pages/Matches";
import { Groups } from "@/pages/Groups";
import { Bracket } from "@/pages/Bracket";
import { Venues } from "@/pages/Venues";
import { DataCenter } from "@/pages/DataCenter";
import { Button } from "@/components/ui";

function LoadingScreen() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="skeleton mb-6 h-56 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div className="glass max-w-md space-y-3 p-8">
        <h1 className="h-display text-xl text-ink">Couldn't load tournament data</h1>
        <p className="text-sm text-ink-muted">{message}</p>
        <Button variant="gold" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function Routes() {
  const { path } = useRoute();
  if (path.startsWith("/matches")) return <Matches />;
  if (path.startsWith("/groups")) return <Groups />;
  if (path.startsWith("/bracket")) return <Bracket />;
  if (path.startsWith("/venues")) return <Venues />;
  if (path.startsWith("/data")) return <DataCenter />;
  return <Dashboard />;
}

export default function App() {
  const loading = useStore((s) => s.loading);
  const loadError = useStore((s) => s.loadError);
  const data = useStore((s) => s.data);
  const init = useStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <RouterProvider>
      {loading ? (
        <LoadingScreen />
      ) : loadError || !data ? (
        <ErrorScreen message={loadError ?? "No data available."} onRetry={init} />
      ) : (
        <Layout>
          <Routes />
          <MatchDetailModal />
        </Layout>
      )}
    </RouterProvider>
  );
}
