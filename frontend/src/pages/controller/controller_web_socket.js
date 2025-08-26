import ws from '@/utils/websocket.js';
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
	const data = JSON.stringify({x, y});
	console.log(data);
	ws.send(data);
}
