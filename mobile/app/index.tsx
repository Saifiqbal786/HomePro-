import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function Index() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    // Check role and redirect
    const role = user.role || user.userType;
    if (role === 'homeowner') {
        return <Redirect href="/(tabs_homeowner)" />;
    } else if (role === 'worker') {
        return <Redirect href="/(tabs_worker)" />;
    }

    // Fallback
    return <Redirect href="/(auth)/login" />;
}
