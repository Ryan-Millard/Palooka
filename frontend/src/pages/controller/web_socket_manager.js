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

function setBatteryPercent(percent) {
	percent = Math.max(0, Math.min(100, Number(percent) || 0));
	const barsToShow = percent === 0 ? 0 : Math.ceil(percent / 20);
	document.querySelectorAll('.bar').forEach(bar => {
		const level = Number(bar.dataset.level);
		if (level <= barsToShow) {
			bar.classList.add('active');
		} else {
			bar.classList.remove('active');
		}
	});
}
export function setupBatteryWebsocket() {
	ws.addOnMessage((data) => {
		try {
			const jsonData = JSON.parse(data);
			if (jsonData.battery !== undefined) {
				setBatteryPercent(jsonData.battery);
			}
		} catch (err) {
			console.error('Error parsing WebSocket message', err);
		}
	});
}
