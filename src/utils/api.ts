/**
 * Helper to dynamically resolve the API base URL.
 * When running as a native Android app (Capacitor), it points to the hosted server.
 * When running in the browser/development mode, it uses relative paths.
 */
export function getApiUrl(): string {
  // If explicitly defined in environment variables, use it
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_URL) {
    return metaEnv.VITE_API_URL;
  }

  // Fallback service URL resolved during Vite build/define
  const serviceUrl = (metaEnv && metaEnv.VITE_SERVICE_URL) || "https://ais-pre-4ummlc223fgx5us3eky3od-266872722206.us-west2.run.app";

  // Detect Capacitor/Native Webview or local testing
  const isCapacitor = (window as any).Capacitor !== undefined || navigator.userAgent.includes('Capacitor');
  
  // Check if window.location is sandboxed or null
  const isSandboxed = !window.location || !window.location.origin || window.location.origin === "null";
  
  if (isCapacitor || isSandboxed || 
      window.location.origin.startsWith('capacitor://') || 
      window.location.origin.startsWith('file://')) {
    // Return the dynamically mapped hosted server URL
    return serviceUrl;
  }

  // If we are in the browser and the origin is a standard HTTP/HTTPS origin, we can return the origin
  // to avoid relative URL resolution issues in nested contexts
  if (window.location.origin && window.location.origin.startsWith('http')) {
    return window.location.origin;
  }

  return serviceUrl;
}
