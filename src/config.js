const config = {
  development: {
    apiUrl: 'https://timelines-backend.onrender.com',
    socketUrl: 'https://timelines-backend.onrender.com'
  },
  production: {
    apiUrl: 'https://timelines-backend.onrender.com',
    socketUrl: 'https://timelines-backend.onrender.com'
  }
};

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export default config[environment];