import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';

export default function HomeownerDashboard() {
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
                        {user?.name || 'Homeowner'}
                    </Text>
                </View>
                <Button variant="outline" title="Logout" onPress={handleLogout} />
            </View>

            {/* Quick Actions */}
            <View className="mb-8">
                <Text className="text-xl font-bold mb-4">Quick Actions</Text>
                <View className="flex-row flex-wrap justify-between">
                    <TouchableOpacity
                        className="bg-blue-600 rounded-xl p-4 w-[48%] mb-4 items-center justify-center shadow"
                        onPress={() => router.push('/(tabs_homeowner)/search')}
                    >
                        <Text className="text-white font-bold text-lg mt-2 text-center">Find a Worker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="bg-white rounded-xl p-4 w-[48%] mb-4 items-center justify-center shadow"
                        style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
                        onPress={() => router.push('/(tabs_homeowner)/bookings')}
                    >
                        <Text className="text-blue-600 font-bold text-lg mt-2 text-center">My Bookings</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Activity */}
            <View className="mb-6">
                <Text className="text-xl font-bold mb-4">Recent Bookings</Text>
                <View className="bg-white p-6 rounded-xl shadow items-center border border-gray-100">
                    <Text className="text-gray-500">You don't have any recent bookings.</Text>
                    <Button title="Book a Pro" variant="outline" className="mt-4" onPress={() => router.push('/(tabs_homeowner)/search')} />
                </View>
            </View>
        </ScrollView>
    );
}
