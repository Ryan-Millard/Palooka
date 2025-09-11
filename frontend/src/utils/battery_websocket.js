import ws from './websocket.js';
ws.connect();

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
