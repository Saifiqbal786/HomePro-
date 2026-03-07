import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface User {
    id: string;
    role: 'homeowner' | 'worker' | 'admin';
    name?: string;
    email?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string, userDetails?: User) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                const decoded: any = jwtDecode(token);

                // Optionally fetch latest user details from backend here
                // const response = await api.get('/auth/me');
                // setUser(response.data.user);

                // For now, construct from decoded token
                setUser({
                    id: decoded.id || decoded.userId,
                    role: decoded.role || decoded.userType
                });
            }
        } catch (e) {
            console.error('Error loading token', e);
            await SecureStore.deleteItemAsync('token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string, userDetails?: User) => {
        await SecureStore.setItemAsync('token', token);
        if (userDetails) {
            setUser(userDetails);
        } else {
            const decoded: any = jwtDecode(token);
            setUser({
                id: decoded.id || decoded.userId,
                role: decoded.role || decoded.userType
            });
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
