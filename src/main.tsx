import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeScript } from "@/components/ThemeScript";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeScript />
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
