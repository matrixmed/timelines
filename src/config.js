// Configuration for different environments
const config = {
    development: {
      apiUrl: 'https://timelines-backend.onrender.com',
      socketUrl: 'https://timelines-backend.onrender.com'
    },
    production: {
      // In production, the API is served from the same origin
      apiUrl: '',
      socketUrl: window.location.origin
    }
  };
  
  // Determine which environment we're in
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  
  // Export the configuration for the current environment
  export default config[environment];