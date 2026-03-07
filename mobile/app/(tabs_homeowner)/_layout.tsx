import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function HomeownerTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerTintColor: '#2563eb', // text-blue-600
                tabBarActiveTintColor: '#2563eb',
                tabBarStyle: Platform.select({
                    ios: { position: 'absolute' },
                    default: {},
                }),
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Find Pro',
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                }}
            />
        </Tabs>
    );
}
