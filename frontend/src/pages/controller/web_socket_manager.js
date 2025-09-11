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
