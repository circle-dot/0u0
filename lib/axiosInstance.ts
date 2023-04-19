import axios from 'axios';

const instance = axios.create();

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        console.log('Request:', config.url);
        // Do something with the request config, like adding authentication tokens
        return config;
    },
    (error) => {
        // console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => {
        // console.log('Response:', response.data);
        // Do something with the response data, like transforming it
        return response;
    },
    (error) => {
        // console.error('Response Error:', error.response);
        return Promise.reject(error);
    }
);

export default instance;
