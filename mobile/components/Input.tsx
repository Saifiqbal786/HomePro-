import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, TouchableOpacity } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    secureTextEntry,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = secureTextEntry;

    return (
        <View className={`w-full mb-4 ${className}`}>
            {label && <Text className="text-gray-700 font-medium mb-1 ml-1">{label}</Text>}

            <View
                className={`flex-row items-center border rounded-lg h-12 px-4 bg-white ${error ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-300'
                    }`}
            >
                <TextInput
                    className="flex-1 text-gray-900 text-base"
                    placeholderTextColor="#9ca3af"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
                        <Text className="text-blue-600 font-medium">
                            {showPassword ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
        </View>
    );
};
