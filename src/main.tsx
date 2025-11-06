import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear all localStorage data to start fresh with Supabase only
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('engflow_')) {
    localStorage.removeItem(key);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
