import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';

export default function WorkerDashboard() {
    const { user, logout } = useContext(AuthContext);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-xl text-gray-500">Welcome back,</Text>
                    <Text className="text-3xl font-bold tracking-tight text-gray-900">
                        {user?.name || 'Worker'}
                    </Text>
                </View>
                <Button variant="outline" title="Logout" onPress={handleLogout} />
            </View>

            {/* Stats Overview */}
            <View className="flex-row justify-between mb-8">
                <View className="bg-white p-4 rounded-xl shadow w-[48%] flex-row items-center border border-gray-100">
                    <View>
                        <Text className="text-3xl font-bold text-gray-900">0</Text>
                        <Text className="text-gray-500">New Requests</Text>
                    </View>
                </View>
                <View className="bg-white p-4 rounded-xl shadow w-[48%] flex-row items-center border border-gray-100">
                    <View>
                        <Text className="text-3xl font-bold text-gray-900">0</Text>
                        <Text className="text-gray-500">Completed</Text>
                    </View>
                </View>
            </View>

            {/* New Job Requests */}
            <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold">Pending Job Requests</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs_worker)/jobs')}>
                        <Text className="text-green-600 font-medium">View All</Text>
                    </TouchableOpacity>
                </View>
                <View className="bg-white p-6 rounded-xl shadow items-center border border-gray-100">
                    <Text className="text-gray-500 mb-2">No pending requests right now.</Text>
                    <Text className="text-gray-400 text-sm">Make sure your profile is visible to homeowners.</Text>
                </View>
            </View>
        </ScrollView>
    );
}
