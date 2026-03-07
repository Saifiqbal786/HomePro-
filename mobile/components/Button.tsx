import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    isLoading = false,
    fullWidth = true,
    className = '',
    disabled,
    ...props
}) => {
    let bgClass = 'bg-blue-600';
    let textClass = 'text-white';

    if (variant === 'secondary') {
        bgClass = 'bg-gray-200';
        textClass = 'text-gray-900';
    } else if (variant === 'outline') {
        bgClass = 'bg-transparent border-2 border-blue-600';
        textClass = 'text-blue-600';
    } else if (variant === 'danger') {
        bgClass = 'bg-red-500';
        textClass = 'text-white';
    }

    const baseContainerClass = `h-12 rounded-lg items-center justify-center px-6 flex-row ${fullWidth ? 'w-full' : 'self-start'
        } ${disabled ? 'opacity-50' : ''}`;

    return (
        <TouchableOpacity
            className={`${baseContainerClass} ${bgClass} ${className}`}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={textClass.includes('white') ? '#fff' : '#000'} />
            ) : (
                <Text className={`font-semibold text-lg ${textClass}`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};
