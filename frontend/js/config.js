// Deployment config: API base URL follows the current origin (except localhost)
// For local development, point to the local backend; for deployed sites, reuse the same domain.
window.KB_API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

