// Deployment config: override API base URL at runtime
// For production on Render, set this to your backend URL
// For local development, leave unset or set to http://localhost:5000
window.KB_API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : 'https://kienportfolio.onrender.com';

