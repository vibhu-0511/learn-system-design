import { useHashRoute, href } from "./router.js";
import { useTheme } from "./store.js";
import { TopBar } from "./ui/TopBar.jsx";
import { ErrorBoundary } from "./ui/ErrorBoundary.jsx";
import HomePage from "./course/HomePage.jsx";

// Placeholder until each route's page lands in a later phase.
function ComingSoon({ route }) {
  const notFound = route.name === "notfound";
  return (
    <section className="glass error-card">
      <h2 style={{ margin: 0, color: "var(--ink)" }}>{notFound ? "Page not found" : "Coming soon"}</h2>
      <p>{notFound ? "That link doesn't match any page." : "This page arrives in a later phase."}</p>
      <a className="pbtn" href={href({ name: "home" })}>
        Back home
      </a>
    </section>
  );
}

function RouteView({ route }) {
  if (route.name === "home") return <HomePage />;
  return <ComingSoon route={route} />;
}

export default function App() {
  const route = useHashRoute();
  const [theme, toggleTheme] = useTheme();

  return (
    <>
      <div className="backdrop" aria-hidden="true" />
      <TopBar route={route} theme={theme} onToggleTheme={toggleTheme} />
      <main className="page">
        <ErrorBoundary resetKey={`${route.name}/${route.params.id ?? ""}`}>
          <RouteView route={route} />
        </ErrorBoundary>
      </main>
    </>
  );
}
