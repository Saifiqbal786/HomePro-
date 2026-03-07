import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import api from '../../services/api';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'homeowner' | 'worker'>('homeowner');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                role // Assuming backend accepts 'role' or 'userType'
            });

            // If the backend returns a token immediately on register:
            if (response.data.token) {
                await login(response.data.token, response.data.user);
                if (role === 'homeowner') {
                    router.replace('/(tabs_homeowner)');
                } else {
                    router.replace('/(tabs_worker)');
                }
            } else {
                Alert.alert('Success', 'Account created successfully! Please login.', [
                    { text: 'OK', onPress: () => router.push('/(auth)/login') }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Registration Failed', error.response?.data?.message || 'Could not create account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>

                <TouchableOpacity onPress={() => router.back()} className="mt-8 mb-6">
                    <Text className="text-blue-600 font-medium">← Back to Login</Text>
                </TouchableOpacity>

                <View className="mb-8">
                    <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
                    <Text className="text-gray-500 text-base">
                        Sign up to get started with Worker-Homeowner
                    </Text>
                </View>

                {/* Role Selection */}
                <View className="flex-row mb-6 bg-gray-100 p-1 rounded-lg">
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center rounded-md ${role === 'homeowner' ? 'bg-white shadow' : ''}`}
                        onPress={() => setRole('homeowner')}
                    >
                        <Text className={`font-semibold ${role === 'homeowner' ? 'text-blue-600' : 'text-gray-500'}`}>Homeowner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center rounded-md ${role === 'worker' ? 'bg-white shadow' : ''}`}
                        onPress={() => setRole('worker')}
                    >
                        <Text className={`font-semibold ${role === 'worker' ? 'text-blue-600' : 'text-gray-500'}`}>Worker</Text>
                    </TouchableOpacity>
                </View>

                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />

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
                    placeholder="Create a strong password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <View className="mt-6 mb-8">
                    <Button
                        title="Sign Up"
                        onPress={handleRegister}
                        isLoading={loading}
                    />
                </View>

                <View className="flex-row justify-center">
                    <Text className="text-gray-600">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                        <Text className="text-blue-600 font-bold">Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
