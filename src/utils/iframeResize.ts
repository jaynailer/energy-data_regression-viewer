export function setupIframeResize() {
  // Only run in iframe context
  if (window.top === window.self) {
    return;
  }
  // iframe-resizer is now handled by the hosted script
}