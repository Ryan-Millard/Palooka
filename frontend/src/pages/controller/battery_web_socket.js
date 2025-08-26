import ws from '@/utils/websocket.js';
ws.connect();

const battery = document.getElementById('battery');

// Calculate the battery color based on percentage (0% = red, 50% = yellow, 100% = green)
function setUpdateBattery(percentage) {
	// Map battery percentage (0-100) to a hue value (0 to 120)
	// 0 = red, 60 = yellow, 120 = green
	const hue = (percentage * 120) / 100;
	const hslValue = `hsl(${hue}, 100%, 50%)`;

	battery.style.background = hslValue;
	battery.textContent = percentage + '%';
}

// Handle incoming WebSocket messages
ws.addOnMessage((data) => {
	try {
		const jsonData = JSON.parse(data);
		if (jsonData.battery !== undefined) {
			const percentage = jsonData.battery;  // Access the 'battery' field
			setUpdateBattery(percentage);        // Update the battery UI
		}
	} catch (error) {
		console.error('Error parsing WebSocket message:', error);
	}
});
