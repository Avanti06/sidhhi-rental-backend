const haversine = require("haversine");

// Function to calculate distance between two locations
function calculateDistance(pickup, drop) {
    try {
        const start = { latitude: pickup.lat, longitude: pickup.lng };
        const end = { latitude: drop.lat, longitude: drop.lng };

        const distance = haversine(start, end, { unit: "km" });
        return distance;
    } catch (error) {
        console.error("Error calculating distance:", error);
        return null;
    }
}

module.exports = { calculateDistance };