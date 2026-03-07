import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function WorkerTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerTintColor: '#16a34a', // green-600 for workers usually, or match branding
                tabBarActiveTintColor: '#16a34a',
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
                name="jobs"
                options={{
                    title: 'Job Requests',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'My Profile',
                }}
            />
        </Tabs>
    );
}
