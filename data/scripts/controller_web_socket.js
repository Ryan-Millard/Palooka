const hostName = window.location.hostname ?? "192.168.4.1";
const ws = new WebSocket("ws://" + hostName + ":81"); // IP of the ESP32 AP, port 81

ws.onmessage = function(event) {
	console.log("Message received:", event.data);
}

function sendFlipData() {
	const flip = true;
	const data = JSON.stringify({ flip });
	console.log(data);
	ws.send(data);
}

function sendSliderData(sliderName, value) {
	const data = JSON.stringify({ sliderName, value });
	console.log(data);
	ws.send(data);
}

// Send joystick data to the ESP32
function sendJoystickData(x, y) {
	// Get current rotation of joystick in radians
	const joystickElement = document.getElementById('joystickControl');
	const rotationDeg = parseFloat(joystickElement.getAttribute('data-rotation') || '0');
	const rotationRad = (rotationDeg * Math.PI) / 180;

	// Apply rotation transformation to the joystick coordinates
	const finalX = (x * Math.cos(rotationRad) - y * Math.sin(rotationRad)) * -1; // * -1 to swap left and right directions
	// This fixes the joystick's turning
	const finalY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

	const data = JSON.stringify({ x: finalX, y: finalY});
	console.log(data);
	ws.send(data);
}
