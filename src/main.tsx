import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearAllLocalStorage, monitorLocalStorageUsage } from "./utils/clearLocalStorage";

// Clear localStorage apenas se necessário (não a cada inicialização)
// Verificar se já foi executada a limpeza antes
const cleanupExecuted = localStorage.getItem('cleanup_executed');
if (!cleanupExecuted) {
  console.log('🧹 Primeira execução: limpando localStorage antigo...');
  clearAllLocalStorage();
  localStorage.setItem('cleanup_executed', Date.now().toString());
} else {
  console.log('✅ LocalStorage já foi limpo anteriormente, mantendo tokens...');
}

// Monitor for any unwanted localStorage usage in development
if (import.meta.env.DEV) {
  monitorLocalStorageUsage();
}

createRoot(document.getElementById("root")!).render(<App />);
