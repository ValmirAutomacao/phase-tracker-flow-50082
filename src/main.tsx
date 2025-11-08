import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearAllLocalStorage, monitorLocalStorageUsage } from "./utils/clearLocalStorage";

// Clear all localStorage data to start fresh with Supabase only
clearAllLocalStorage();

// Monitor for any unwanted localStorage usage in development
if (import.meta.env.DEV) {
  monitorLocalStorageUsage();
}

createRoot(document.getElementById("root")!).render(<App />);
