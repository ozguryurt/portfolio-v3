import { lazy, Suspense } from "react";
import { useSite } from "./site";

const App = lazy(() => import("./App"));
const ProjectsPage = lazy(() => import("./ProjectsPage"));

export default function Site() {
  const { route, language } = useSite();
  return (
    <Suspense fallback={<div className="page-loading" role="status" aria-label={language === "tr" ? "Sayfa yükleniyor" : "Loading page"}>öy.</div>}>
      {route.page === "projects" ? <ProjectsPage /> : <App />}
    </Suspense>
  );
}
