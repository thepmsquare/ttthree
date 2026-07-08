import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/outfit/index.css";
import "@fontsource/fraunces/index.css";
import "./stylesheets/index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./contexts/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
