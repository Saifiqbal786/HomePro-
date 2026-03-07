import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            await login(response.data.token, response.data.user);

            const role = response.data.user.role || response.data.user.userType;

            if (role === 'homeowner') {
                router.replace('/(tabs_homeowner)');
            } else if (role === 'worker') {
                router.replace('/(tabs_worker)');
            } else if (role === 'admin') {
                Alert.alert('Not supported yet', 'Admin mobile dashboard coming soon.');
            } else {
                router.replace('/');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View className="items-center mb-10">
                    <Text className="text-4xl font-bold text-blue-600 mb-2">Welcome Back</Text>
                    <Text className="text-gray-500 text-base text-center">
                        Login to access your dashboard
                    </Text>
                </View>

                <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity className="self-end mb-8 mt-2">
                    <Text className="text-blue-600 font-medium">Forgot Password?</Text>
                </TouchableOpacity>

                <Button
                    title="Login"
                    onPress={handleLogin}
                    isLoading={loading}
                />

                <View className="flex-row justify-center mt-8">
                    <Text className="text-gray-600">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                        <Text className="text-blue-600 font-bold">Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
