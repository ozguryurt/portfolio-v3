import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Site from "./SiteView";
import { SiteProvider } from "./SiteContext";
import { initializeSite } from "./localeRouting";
import "./languages.css";

const initialRoute = initializeSite();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteProvider initialRoute={initialRoute}>
      <Site />
    </SiteProvider>
  </StrictMode>,
);
