import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error("Failed to initialize app:", error);
  // Fallback UI
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: #ff0000;">Application Error</h1>
          <p>Failed to initialize the application.</p>
          <pre style="background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: left; max-width: 600px; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
          </pre>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
