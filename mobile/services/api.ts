import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2.
// For iOS Simulator, localhost is localhost.
// Replace with your computer's local network IP for physical device testing.
const API_URL = __DEV__
    ? (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api')
    : 'https://your-production-url.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to automatically attach the token
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
