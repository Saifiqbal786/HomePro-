module.exports = {
    // Payment is calculated as: hourly_rate * (duration_minutes / 60)
    calculatePayment(hourlyRate, durationMinutes) {
        const hours = durationMinutes / 60;
        return Math.round(hourlyRate * hours * 100) / 100;
    },

    // Minimum billing duration in minutes
    minimumBillingMinutes: 30,
};
