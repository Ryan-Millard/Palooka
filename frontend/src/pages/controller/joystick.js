import { isEditMode } from './edit_mode.js';
import { sendJoystickData } from './web_socket_manager.js';

let joystickCenter = { x: 0, y: 0 };
let joystickActive = false;
let maxJoystickDistance = 0;

export function initJoystick() {
	const checkedRadio = document.querySelector('input[name="inputType"]:checked');
	if (!checkedRadio || checkedRadio.value !== 'joystick') return;
	const joystick = document.querySelector('.joystick');
	const handle = document.querySelector('.joystick-handle');
	const joystickRect = joystick.getBoundingClientRect();
	joystickCenter = {
		x: joystickRect.width / 2,
		y: joystickRect.height / 2
	};
	maxJoystickDistance = (joystickRect.width / 2) - (handle.offsetWidth / 2);
	handle.style.left = '50%';
	handle.style.top = '50%';
	joystick.addEventListener('mousedown', startJoystickMouse);
	joystick.addEventListener('touchstart', startJoystickTouch, { passive: false });
}

function startJoystickMouse(e) {
	if (isEditMode) return;
	e.preventDefault();
	joystickActive = true;
	moveJoystickMouse(e);
	document.addEventListener('mousemove', moveJoystickMouse);
	document.addEventListener('mouseup', stopJoystickMouse);
}

function startJoystickTouch(e) {
	if (isEditMode) return;
	e.preventDefault();
	joystickActive = true;
	moveJoystickTouch(e);
	document.addEventListener('touchmove', moveJoystickTouch, { passive: false });
	document.addEventListener('touchend', stopJoystickTouch);
}

function moveJoystickMouse(e) {
	if (!joystickActive || isEditMode) return;
	const joystick = document.querySelector('.joystick');
	const joystickRect = joystick.getBoundingClientRect();
	updateJoystickPosition(e.clientX, e.clientY);
}

function moveJoystickTouch(e) {
	if (!joystickActive || isEditMode) return;
	e.preventDefault();
	updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
}

function prepareJoystickCoordinates(x, y) {
	const joystickRect = document.querySelector('.joystick').getBoundingClientRect();
	// Keep values within the bounds of the joystick
	let relX = Math.min(x, joystickRect.right);
	relX = Math.max(relX, joystickRect.left);
	let relY = Math.min(y, joystickRect.bottom);
	relY = Math.max(relY, joystickRect.top);

	// Account for distance from origin (top-left corner of screen)
	// This operation basically moves the touch area (joystick bounds) to the top-left
	relX -= joystickRect.left;
	relY -= joystickRect.top;

	// Turn joystick into a cartesian plane by splitting x and y in 2
	// This creates 4 quarters, with positive and negative values
	// In relation to the screen, the center of the joystick would be in the top-left (0, 0)
	relX -= joystickRect.width/2;
	relY -= joystickRect.height/2;

	/*
	 * Convert to cartesian plane coordinate system
	 * x & y values based on cartesian planes
	 *     Normal (Cartesian):
	 *     x<0; y>0 | x>0; y>0
	 *     -------------------
	 *     x<0; y<0 | x>0; y<0
	 *                 (+)
	 *                  |
	 *             (-) --- (+)
	 *                  |
	 *                 (-)
	 * --------------------------------------------
	 *     Current (Computer):
	 *     x<0; y<0 | x>0; y<0
	 *     -------------------
	 *     x<0; y>0 | x>0; y>0
	 *                 (-)
	 *                  |
	 *             (-) --- (+)
	 *                  | 	Content
	 *                 (+)	Here
	 * Notice that the y-values are different
	 */
	relY = -relY;

	// Cartesian plane rotation formula
	// Rotate a point (x, y) by angle θ (in radians) counterclockwise around the origin:
	// x′ = x * Math.cos(θ) - y * Math.sin(θ);
	// y′ = x * Math.sin(θ) + y * Math.cos(θ);
	// Get current rotation of joystickControl in radians
	const joystickElement = document.getElementById('joystickControl');
	const deg = parseFloat(joystickElement.getAttribute('data-rotation') || '0');
	const theta = (deg * Math.PI) / 180;
	// Apply the rotation
	const rotatedX = relX * Math.cos(theta) - relY * Math.sin(theta);
	const rotatedY = relX * Math.sin(theta) + relY * Math.cos(theta);

	// Convert to decimal between 0 and 1 for use on server
	// Using the decimal allows different speeds to be sent for server-side processing
	const decimalX = rotatedX / (joystickRect.width / 2)
	const decimalY = rotatedY / (joystickRect.height / 2)

	// Round to 5 decimal places to avoid server overloads
	const roundedX = Math.round(decimalX * 1e5) / 1e5;
	const roundedY = Math.round(decimalY * 1e5) / 1e5;

	console.log("Final X: " + roundedX, "Final Y: " + roundedY);

	return [roundedX, roundedY];
}

function updateHandlePosition(x, y) {
	const handle = document.querySelector('.joystick-handle');
	const joystick = document.querySelector('.joystick');
	const joystickRect = joystick.getBoundingClientRect();
	const joystickElement = document.getElementById('joystickControl');

	// Calculate joystick center
	joystickCenter = {
		x: joystickRect.width / 2,
		y: joystickRect.height / 2
	};

	// Get current rotation in radians
	const rotationDeg = parseFloat(joystickElement.getAttribute('data-rotation') || '0');
	const rotationRad = (rotationDeg * Math.PI) / 180;

	// Calculate relative position from touch point to joystick top-left
	const relX = x - joystickRect.left;
	const relY = y - joystickRect.top;

	// Calculate delta from center
	let deltaX = relX - joystickCenter.x;
	let deltaY = relY - joystickCenter.y;

	// Apply inverse rotation to align with joystick's coordinate system
	const cosRot = Math.cos(-rotationRad);
	const sinRot = Math.sin(-rotationRad);
	const localDeltaX = deltaX * cosRot - deltaY * sinRot;
	const localDeltaY = deltaX * sinRot + deltaY * cosRot;

	// Calculate distance from center in local coordinates
	const distance = Math.sqrt(localDeltaX * localDeltaX + localDeltaY * localDeltaY);

	// If distance exceeds max, scale down while preserving direction
	const constrainedDistance = Math.min(distance, maxJoystickDistance);

	// Calculate scaling factor (if needed)
	const scaleFactor = distance > 0 ? constrainedDistance / distance : 0;

	// Apply scaling to constrain within bounds
	const constrainedLocalX = localDeltaX * scaleFactor;
	const constrainedLocalY = localDeltaY * scaleFactor;

	// Translate to handle position (centered at 50%)
	handle.style.transform = `translate(calc(-50% + ${constrainedLocalX}px), calc(-50% + ${constrainedLocalY}px))`;
}
function updateJoystickPosition(x, y) {
	// Send normalized values
	const preparedData = prepareJoystickCoordinates(x, y);
	sendJoystickData(...preparedData);

	updateHandlePosition(x, y);
}

function stopJoystickMouse() {
	if (!joystickActive) return;
	sendJoystickData(0, 0); // Reset the actual device
	resetJoystick();
	document.removeEventListener('mousemove', moveJoystickMouse);
	document.removeEventListener('mouseup', stopJoystickMouse);
}

function stopJoystickTouch() {
	if (!joystickActive) return;
	sendJoystickData(0, 0); // Reset the actual device
	resetJoystick();
	document.removeEventListener('touchmove', moveJoystickTouch);
	document.removeEventListener('touchend', stopJoystickTouch);
}

function resetJoystick() {
	joystickActive = false;
	const handle = document.querySelector('.joystick-handle');
	handle.style.transform = 'translate(-50%, -50%)';
	console.log('Joystick reset');
}
