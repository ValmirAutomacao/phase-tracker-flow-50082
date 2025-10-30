import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStorage } from "./lib/localStorage";

// Initialize localStorage with default data
initializeStorage();

createRoot(document.getElementById("root")!).render(<App />);
