import ws from './websocket.js';
ws.connect();

// Define functions globally
window.sendFlipData = function() {
	const flip = true;
	const data = JSON.stringify({ flip });
	console.log(data);
	ws.send(data);
}

window.sendSliderData = function(sliderName, value) {
	const data = JSON.stringify({ sliderName, value });
	console.log(data);
	ws.send(data);
}

window.sendJoystickData = function(x, y) {
	// // Get current rotation of joystick in radians
	// const joystickElement = document.getElementById('joystickControl');
	// const rotationDeg = parseFloat(joystickElement.getAttribute('data-rotation') || '0');
	// const rotationRad = (rotationDeg * Math.PI) / 180;

	// // Apply rotation transformation to the joystick coordinates
	// const finalX = (x * Math.cos(rotationRad) - y * Math.sin(rotationRad)) * -1;
	// const finalY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

	const data = JSON.stringify({x, y});
	console.log(data);
	ws.send(data);
}
