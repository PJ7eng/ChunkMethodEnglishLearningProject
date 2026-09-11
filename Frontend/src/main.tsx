
  import { createRoot } from "react-dom/client";
  import { SecureStorage } from "@aparajita/capacitor-secure-storage";
  import { TextToSpeech } from "@capacitor-community/text-to-speech";
  import App from "./app/App";
  import "./styles/index.css";
  import * as Sentry from "@sentry/react";
  import { isNativePlatform } from "./app/platform";

  // Register native plugins during startup. A delayed dynamic import can
  // hang forever waiting for a Capacitor callback that never fires.
  void SecureStorage;
  void TextToSpeech;

  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
    });
  }

  createRoot(document.getElementById("root")!).render(<App />);

  if ("serviceWorker" in navigator && import.meta.env.PROD && !isNativePlatform) {
    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
    });
  }
  