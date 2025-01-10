import axios from 'axios';

// Create an axios instance with base configurations
const api = axios.create({
    baseURL: 'http://192.168.38.194:8000', // Replace with your API's base URL
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

export default api;
