import { useEffect, useState, createContext, useContext, type ReactNode } from "react";

// Minimal hash router — no dependency, and works on static hosts / GitHub Pages
// with no server rewrite rules. Routes look like "#/matches?team=usa".

export type Route = {
  path: string; // e.g. "/matches"
  params: URLSearchParams;
};

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path: path || "/", params: new URLSearchParams(query) };
}

const RouterCtx = createContext<Route>({ path: "/", params: new URLSearchParams() });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return <RouterCtx.Provider value={route}>{children}</RouterCtx.Provider>;
}

export function useRoute(): Route {
  return useContext(RouterCtx);
}

export function navigate(to: string): void {
  window.location.hash = to.startsWith("#") ? to.slice(1) : to;
  // Scroll to top on navigation for a clean page transition.
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function hrefFor(to: string): string {
  return `#${to.startsWith("/") ? to : `/${to}`}`;
}
