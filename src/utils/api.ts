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

  // Detect Capacitor/Native Webview or local testing
  const isCapacitor = (window as any).Capacitor !== undefined || navigator.userAgent.includes('Capacitor');
  
  if (isCapacitor || window.location.origin.startsWith('capacitor://') || window.location.origin.startsWith('file://')) {
    // Return the production hosted server URL for the Android app
    return "https://ais-pre-4ummlc223fgx5us3eky3od-266872722206.us-west2.run.app";
  }

  return "";
}
