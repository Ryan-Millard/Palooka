const ws = new WebSocket("ws://192.168.4.1:81"); // IP of the ESP32 AP, port 81

// Send joystick data to the ESP32
function sendJoystickData(x, y) {
	const data = JSON.stringify({ x, y });
	ws.send(data);
}

// Joystick class to encapsulate the widget functionality
class Joystick {
	constructor(container) {
		this.container = container;
		this.knob = container.querySelector('.joystick-knob');
		this.dragging = false;

		// Initialize center and maxDistance
		this.updateDimensions();

		// Recalculate dimensions on resize (e.g., fullscreen change)
		window.addEventListener('resize', this.updateDimensions.bind(this));

		// Bind event listeners
		this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
	}

	updateDimensions() {
		// Recalculate center and maxDistance based on current container size
		this.centerX = this.container.offsetWidth / 2;
		this.centerY = this.container.offsetHeight / 2;
		this.maxDistance = this.container.offsetWidth / 2 - this.knob.offsetWidth / 2;
	}

	onPointerDown(e) {
		e.preventDefault();
		this.dragging = true;
		document.addEventListener('pointermove', this.onPointerMoveBound = this.onPointerMove.bind(this));
		document.addEventListener('pointerup', this.onPointerUpBound = this.onPointerUp.bind(this));
		this.moveKnob(e);
	}

	onPointerMove(e) {
		if (!this.dragging) return;
		this.moveKnob(e);
	}

	onPointerUp(e) {
		this.dragging = false;
		this.knob.style.left = '50%';
		this.knob.style.top = '50%';
		this.knob.style.transform = 'translate(-50%, -50%)';
		this.updateCoords(this.centerX, this.centerY);
		document.removeEventListener('pointermove', this.onPointerMoveBound);
		document.removeEventListener('pointerup', this.onPointerUpBound);
	}

	moveKnob(e) {
		const rect = this.container.getBoundingClientRect();
		let x = e.clientX - rect.left;
		let y = e.clientY - rect.top;

		const deltaX = x - this.centerX;
		const deltaY = y - this.centerY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		let clampedX = deltaX;
		let clampedY = deltaY;
		if (distance > this.maxDistance) {
			const ratio = this.maxDistance / distance;
			clampedX *= ratio;
			clampedY *= ratio;
		}

		this.knob.style.left = (this.centerX + clampedX) + 'px';
		this.knob.style.top = (this.centerY + clampedY) + 'px';
		this.knob.style.transform = 'translate(-50%, -50%)';

		this.updateCoords(this.centerX + clampedX, this.centerY + clampedY);
	}

	updateCoords(x, y) {
		const normX = ((x - this.centerX) / this.maxDistance).toFixed(2);
		const normY = ((y - this.centerY) / this.maxDistance).toFixed(2);
		console.table(normX, normY);
		sendJoystickData(normX, normY);
	}
}

// Instantiate the joystick by providing the container and the coordinates display elements.
const joystickContainer = document.getElementById('myJoystick');
const joystick = new Joystick(joystickContainer);
