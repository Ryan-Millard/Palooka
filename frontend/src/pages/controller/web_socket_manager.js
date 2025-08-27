import ws from '@/utils/websocket.js';
ws.connect();

export function sendFlipData() {
	const flip = true;
	const data = JSON.stringify({ flip });
	console.log(data);
	ws.send(data);
}

export function sendSliderData(sliderName, value) {
	const data = JSON.stringify({ sliderName, value });
	console.log(data);
	ws.send(data);
}

export function sendJoystickData(x, y) {
	const data = JSON.stringify({x, y});
	console.log(data);
	ws.send(data);
}

export function setupBatteryWebsocket() {
	const battery = document.getElementById('battery');

	// Calculate the battery color based on percentage (0% = red, 50% = yellow, 100% = green)
	function updateBattery(percentage) {
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
				updateBattery(percentage);		// Update the battery UI
			}
		} catch (error) {
			console.error('Error parsing WebSocket message:', error);
		}
	});
}
