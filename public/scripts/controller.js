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

		// Center coordinates of the container
		this.centerX = container.clientWidth / 2;
		this.centerY = container.clientHeight / 2;
		// Maximum distance the knob can move from center
		this.maxDistance = container.clientWidth / 2 - this.knob.clientWidth / 2;
		this.dragging = false;

		// Bind event listener to the container so any touch will reposition the knob.
		this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
	}

	onPointerDown(e) {
		e.preventDefault();
		this.dragging = true;
		// Attach move and up listeners on the document.
		document.addEventListener('pointermove', this.onPointerMoveBound = this.onPointerMove.bind(this));
		document.addEventListener('pointerup', this.onPointerUpBound = this.onPointerUp.bind(this));
		// Immediately reposition the knob to where the pointer is.
		this.moveKnob(e);
	}

	onPointerMove(e) {
		if (!this.dragging) return;
		this.moveKnob(e);
	}

	onPointerUp(e) {
		this.dragging = false;
		// Reset the knob to the center position when the pointer is released.
		this.knob.style.left = '50%';
		this.knob.style.top = '50%';
		this.knob.style.transform = 'translate(-50%, -50%)';
		this.updateCoords(this.centerX, this.centerY);
		// Remove move and up listeners.
		document.removeEventListener('pointermove', this.onPointerMoveBound);
		document.removeEventListener('pointerup', this.onPointerUpBound);
	}

	moveKnob(e) {
		// Calculate the pointer position relative to the container.
		const rect = this.container.getBoundingClientRect();
		let x = e.clientX - rect.left;
		let y = e.clientY - rect.top;

		// Calculate offset from the container's center.
		const deltaX = x - this.centerX;
		const deltaY = y - this.centerY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		// If the pointer is outside the allowed radius, clamp its position.
		let clampedX = deltaX;
		let clampedY = deltaY;
		if (distance > this.maxDistance) {
			const ratio = this.maxDistance / distance;
			clampedX *= ratio;
			clampedY *= ratio;
		}

		// Set the knob's position.
		this.knob.style.left = (this.centerX + clampedX) + 'px';
		this.knob.style.top = (this.centerY + clampedY) + 'px';
		this.knob.style.transform = 'translate(-50%, -50%)';

		// Update the coordinates display (normalized to a range from -1 to 1).
		this.updateCoords(this.centerX + clampedX, this.centerY + clampedY);
	}

	updateCoords(x, y) {
		const normX = ((x - this.centerX) / this.maxDistance).toFixed(2);
		const normY = ((y - this.centerY) / this.maxDistance).toFixed(2);
		console.table(normX, normY);

		// Send the joystick data to the ESP32 via WebSocket
		sendJoystickData(normX, normY);
	}
}

// Instantiate the joystick by providing the container and the coordinates display elements.
const joystickContainer = document.getElementById('myJoystick');
const joystick = new Joystick(joystickContainer);
