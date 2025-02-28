// Configuration for different environments
const config = {
    development: {
      apiUrl: 'http://localhost:3001',
      socketUrl: 'http://localhost:3001'
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