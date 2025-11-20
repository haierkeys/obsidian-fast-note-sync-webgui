let API_URL = localStorage.getItem('API_URL');
const env = {
    API_URL: API_URL ? API_URL : (process.env.NODE_ENV === 'production' ? window.location.origin : 'https://sync.diybeta.com'),
    debug: true
};

export default env;