const hostName = window.location.hostname ?? "192.168.4.1";
const ws = new WebSocket("ws://" + hostName + ":81"); // IP of the ESP32 AP, port 81

let isEditMode = true;
let activeElement = null;
let isResizing = false;
let isRotating = false;
let startX, startY, startWidth, startHeight, startLeft, startTop, startRotation;
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let maxJoystickDistance = 0;

// Mode Toggle
document.getElementById('inputType').addEventListener('change', changeInputType);

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

function toggleMode() {
	isEditMode = !isEditMode;
	document.getElementById('controller').classList.toggle('edit-mode');
	document.getElementById('modeToggle').textContent = 
		isEditMode ? 'Save' : 'Edit';
	saveLayout();
	updateControlInteractivity();
	if (!isEditMode) {
		initJoystick();
	}
}

// Update interactive controls based on mode.
function updateControlInteractivity() {
	// Disable interactive child elements in edit mode
	document.querySelectorAll('.control-button, .slider, .joystick, .joystick-handle').forEach(el => {
		el.style.pointerEvents = isEditMode ? 'none' : 'auto';
	});
}

// Input Type Change: show/hide joystick and slider elements
function changeInputType() {
	const type = document.getElementById('inputType').value;
	document.getElementById('joystickControl').style.display = type === 'joystick' ? 'block' : 'none';
	document.querySelectorAll('.slider-element').forEach(el => {
		el.style.display = type === 'sliders' ? 'block' : 'none';
	});
	if (type === 'joystick' && !isEditMode) {
		initJoystick();
	}
}

// Initialize aspect ratios for buttons (and other elements if needed)
function initAspectRatios() {
	document.querySelectorAll('.button-element, .joystick-element, .slider-element').forEach(element => {
		const width = parseInt(window.getComputedStyle(element).width);
		const height = parseInt(window.getComputedStyle(element).height);
		if (height > 0) {
			const aspectRatio = width / height;
			element.setAttribute('data-aspect-ratio', aspectRatio.toFixed(4));
		}
		// Initialize rotation attribute if not set
		if (!element.hasAttribute('data-rotation')) {
			element.setAttribute('data-rotation', '0');
		}
	});
}

// --- New Drag Logic using Pointer and Touch Events ---
const controlElements = document.querySelectorAll('.control-element');

controlElements.forEach(element => {
	element.addEventListener('pointerdown', startDrag);
	element.addEventListener('touchstart', startDrag, { passive: false });
});

function startDrag(e) {
	if (!isEditMode) return;
	e.preventDefault();
	// Prevent dragging when interacting with interactive controls in edit mode.
	if (e.target.classList.contains('control-button') ||
		e.target.classList.contains('slider') ||
		e.target.classList.contains('joystick') ||
		e.target.classList.contains('joystick-handle')) {
		return;
	}

	isResizing = e.target.classList.contains('resize-handle');
	isRotating = e.target.classList.contains('rotate-handle');
	activeElement = e.currentTarget;
	startX = e.clientX || (e.touches && e.touches[0].clientX);
	startY = e.clientY || (e.touches && e.touches[0].clientY);

	const computedStyle = window.getComputedStyle(activeElement);
	startWidth = parseInt(computedStyle.width);
	startHeight = parseInt(computedStyle.height);
	startLeft = parseInt(computedStyle.left);
	startTop = parseInt(computedStyle.top);
	startRotation = parseFloat(activeElement.getAttribute('data-rotation') || '0');

	document.addEventListener('pointermove', handleDrag);
	document.addEventListener('pointerup', stopDrag);
	document.addEventListener('touchmove', handleDrag, { passive: false });
	document.addEventListener('touchend', stopDrag);
}

function handleDrag(e) {
	if (!activeElement || !isEditMode) return;
	e.preventDefault();

	const currentX = e.clientX || (e.touches && e.touches[0].clientX);
	const currentY = e.clientY || (e.touches && e.touches[0].clientY);
	const deltaX = currentX - startX;
	const deltaY = currentY - startY;
	const containerRect = document.getElementById('controller').getBoundingClientRect();

	if (isRotating) {
		// Calculate rotation based on the center of the element
		const rect = activeElement.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		// Calculate start and current angle from center
		const startAngle = Math.atan2(startY - centerY, startX - centerX);
		const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);

		// Calculate angle difference in degrees
		let rotation = startRotation + ((currentAngle - startAngle) * 180 / Math.PI);

		// Optional: snap to 15-degree increments
		rotation = Math.round(rotation / 15) * 15;

		activeElement.style.transform = `rotate(${rotation}deg)`;
		activeElement.setAttribute('data-rotation', rotation.toString());
	} else if (isResizing) {
		// Get rotation in radians
		const rotationDeg = parseFloat(activeElement.getAttribute('data-rotation') || '0');
		const rotationRad = (rotationDeg * Math.PI) / 180;

		// Calculate delta in the rotated coordinate system
		const cosRot = Math.cos(rotationRad);
		const sinRot = Math.sin(rotationRad);
		const rotatedDeltaX = deltaX * cosRot + deltaY * sinRot;
		const rotatedDeltaY = -deltaX * sinRot + deltaY * cosRot;

		// Resize with aspect ratio for button, joystick, and slider elements if applicable
		if (activeElement.classList.contains('button-element') ||
			activeElement.classList.contains('joystick-element') ||
			activeElement.classList.contains('slider-element')) {
			const aspectRatio = parseFloat(activeElement.getAttribute('data-aspect-ratio'));
			let newWidth = Math.max(40, startWidth + rotatedDeltaX);
			let newHeight = newWidth / aspectRatio;
			const maxWidth = containerRect.width - startLeft;
			const maxHeight = containerRect.height - startTop;
			if (newWidth > maxWidth) {
				newWidth = maxWidth;
				newHeight = newWidth / aspectRatio;
			}
			if (newHeight > maxHeight) {
				newHeight = maxHeight;
				newWidth = newHeight * aspectRatio;
			}
			activeElement.style.width = newWidth + 'px';
			activeElement.style.height = newHeight + 'px';
		} else {
			// Free resizing for other elements
			let newWidth = Math.max(40, startWidth + rotatedDeltaX);
			let newHeight = Math.max(40, startHeight + rotatedDeltaY);
			const maxWidth = containerRect.width - startLeft;
			const maxHeight = containerRect.height - startTop;
			newWidth = Math.min(newWidth, maxWidth);
			newHeight = Math.min(newHeight, maxHeight);
			activeElement.style.width = newWidth + 'px';
			activeElement.style.height = newHeight + 'px';
		}
	} else {
		// DRAGGING - Rotation-aware bounds check
		let newLeft = startLeft + deltaX;
		let newTop = startTop + deltaY;

		const elementWidth = activeElement.offsetWidth;
		const elementHeight = activeElement.offsetHeight;
		const rotationDeg = parseFloat(activeElement.getAttribute('data-rotation') || '0');
		const rotationRad = (rotationDeg * Math.PI) / 180;

		// Calculate rotated corners relative to center
		const corners = [
			{ x: -elementWidth/2, y: -elementHeight/2 },
			{ x: elementWidth/2, y: -elementHeight/2 },
			{ x: -elementWidth/2, y: elementHeight/2 },
			{ x: elementWidth/2, y: elementHeight/2 }
		];

		const rotatedCorners = corners.map(corner => ({
			x: corner.x * Math.cos(rotationRad) - corner.y * Math.sin(rotationRad),
			y: corner.x * Math.sin(rotationRad) + corner.y * Math.cos(rotationRad)
		}));

		// Find min/max values of rotated corners
		const minX = Math.min(...rotatedCorners.map(c => c.x));
		const maxX = Math.max(...rotatedCorners.map(c => c.x));
		const minY = Math.min(...rotatedCorners.map(c => c.y));
		const maxY = Math.max(...rotatedCorners.map(c => c.y));

		// Calculate allowed position based on AABB
		const allowedLeftMin = -(elementWidth/2 + minX);
		const allowedLeftMax = containerRect.width - (elementWidth/2 + maxX);
		const allowedTopMin = -(elementHeight/2 + minY);
		const allowedTopMax = containerRect.height - (elementHeight/2 + maxY);

		newLeft = Math.max(allowedLeftMin, Math.min(newLeft, allowedLeftMax));
		newTop = Math.max(allowedTopMin, Math.min(newTop, allowedTopMax));

		activeElement.style.left = newLeft + 'px';
		activeElement.style.top = newTop + 'px';
	}
}

function stopDrag(e) {
	activeElement = null;
	isResizing = false;
	isRotating = false;
	document.removeEventListener('pointermove', handleDrag);
	document.removeEventListener('pointerup', stopDrag);
	document.removeEventListener('touchmove', handleDrag);
	document.removeEventListener('touchend', stopDrag);
	saveLayout();
}
// --- End New Drag Logic ---

// Apply rotations from stored data
function applyRotations() {
	document.querySelectorAll('.control-element').forEach(element => {
		const rotation = element.getAttribute('data-rotation') || '0';
		element.style.transform = `rotate(${rotation}deg)`;
	});
}

// Joystick functionality for Use Mode
function initJoystick() {
	if (document.getElementById('inputType').value !== 'joystick') return;
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
	const relX = e.clientX - joystickRect.left;
	const relY = e.clientY - joystickRect.top;
	updateJoystickPosition(relX, relY);
}

function moveJoystickTouch(e) {
	if (!joystickActive || isEditMode) return;
	e.preventDefault();
	const joystick = document.querySelector('.joystick');
	const joystickRect = joystick.getBoundingClientRect();
	const relX = e.touches[0].clientX - joystickRect.left;
	const relY = e.touches[0].clientY - joystickRect.top;
	updateJoystickPosition(relX, relY);
}

function updateJoystickPosition(relX, relY) {
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

	// Calculate delta from center in the rotated coordinate system
	let deltaX = relX - joystickCenter.x;
	let deltaY = relY - joystickCenter.y;

	// Apply reverse rotation to get the deltas in the joystick's local coordinate system
	// This ensures the handle appears under the user's finger
	const cosRot = Math.cos(rotationRad);
	const sinRot = Math.sin(rotationRad);
	const rotatedDeltaX = deltaX * cosRot + deltaY * sinRot;
	const rotatedDeltaY = -deltaX * sinRot + deltaY * cosRot;

	// Calculate distance (constrained by max distance)
	const distance = Math.min(maxJoystickDistance,
		Math.sqrt(rotatedDeltaX * rotatedDeltaX + rotatedDeltaY * rotatedDeltaY));

	// Calculate angle in local coordinate system
	const angle = Math.atan2(rotatedDeltaY, rotatedDeltaX);

	// Calculate new position
	const newX = distance * Math.cos(angle);
	const newY = distance * Math.sin(angle);

	// Set handle position
	handle.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;

	// For sending data to the device, use the original (screen coordinate) deltas
	// normalized to the range [-1, 1]
	const joystickX = Math.max(-1, Math.min(1, deltaX / maxJoystickDistance));
	const joystickY = Math.max(-1, Math.min(1, deltaY / maxJoystickDistance));

	// Send normalized values
	sendJoystickData(joystickX, joystickY);
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

// Save/Load Layout
function saveLayout() {
	const layout = [];
	document.querySelectorAll('.control-element').forEach(element => {
		layout.push({
			id: element.id,
			left: element.style.left,
			top: element.style.top,
			width: element.style.width,
			height: element.style.height,
			aspectRatio: element.getAttribute('data-aspect-ratio') || 'auto',
			rotation: element.getAttribute('data-rotation') || '0'
		});
	});
	localStorage.setItem('controllerLayout', JSON.stringify(layout));
}

function loadLayout() {
	const saved = localStorage.getItem('controllerLayout');
	if (saved) {
		try {
			const layout = JSON.parse(saved);
			layout.forEach(item => {
				const element = document.getElementById(item.id);
				if (element) {
					element.style.left = item.left;
					element.style.top = item.top;
					element.style.width = item.width;
					element.style.height = item.height;
					if (item.aspectRatio && item.aspectRatio !== 'auto') {
						element.setAttribute('data-aspect-ratio', item.aspectRatio);
					}
					if (item.rotation) {
						element.setAttribute('data-rotation', item.rotation);
						element.style.transform = `rotate(${item.rotation}deg)`;
					}
				}
			});
		} catch (e) {
			console.error('Error loading saved layout', e);
		}
	}
}

// Add this function to scripts/controller.js
function setDefaultLayout() {
	// Only set default if no saved layout exists
	if (!localStorage.getItem('controllerLayout')) {
		const controller = document.getElementById('controller');
		const containerWidth = controller.clientWidth;
		const containerHeight = controller.clientHeight;

		// Calculate grid-based layout to prevent overlap
		const gridColumns = 3;
		const gridRows = 5;
		const cellWidth = containerWidth / gridColumns;
		const cellHeight = containerHeight / gridRows;
		const padding = 10; // Padding inside each cell

		// JOYSTICK - takes up 2x2 grid cells in the top-left
		const joystick = document.getElementById('joystickControl');
		joystick.style.left = padding + 'px';
		joystick.style.top = padding + 'px';
		joystick.style.width = (cellWidth * 2) - (padding * 2) + 'px';
		joystick.style.height = (cellWidth * 2) - (padding * 2) + 'px'; // Keep it square

		// SLIDER LEFT - takes up 1 column, row 3
		const sliderLeft = document.getElementById('sliderLeft');
		sliderLeft.style.left = padding + 'px';
		sliderLeft.style.top = (cellHeight * 2) + padding + 'px';
		sliderLeft.style.width = (cellWidth * 2) - (padding * 2) + 'px';
		sliderLeft.style.height = cellHeight - (padding * 2) + 'px';

		// SLIDER RIGHT - takes up 1 column, row 4
		const sliderRight = document.getElementById('sliderRight');
		sliderRight.style.left = padding + 'px';
		sliderRight.style.top = (cellHeight * 3) + padding + 'px';
		sliderRight.style.width = (cellWidth * 2) - (padding * 2) + 'px';
		sliderRight.style.height = cellHeight - (padding * 2) + 'px';

		// BUTTON 1 - top right corner
		const button1 = document.getElementById('button1');
		button1.style.left = (cellWidth * 2) + padding + 'px';
		button1.style.top = padding + 'px';
		button1.style.width = cellWidth - (padding * 2) + 'px';
		button1.style.height = cellHeight - (padding * 2) + 'px';

		// BUTTON 2 - below button 1
		const button2 = document.getElementById('button2');
		button2.style.left = (cellWidth * 2) + padding + 'px';
		button2.style.top = cellHeight + padding + 'px';
		button2.style.width = cellWidth - (padding * 2) + 'px';
		button2.style.height = cellHeight - (padding * 2) + 'px';

		// Set all rotations to 0
		document.querySelectorAll('.control-element').forEach(element => {
			element.setAttribute('data-rotation', '0');
			element.style.transform = 'rotate(0deg)';

			// Calculate and set aspect ratio
			const width = parseInt(element.style.width);
			const height = parseInt(element.style.height);
			if (height > 0) {
				const aspectRatio = width / height;
				element.setAttribute('data-aspect-ratio', aspectRatio.toFixed(4));
			}
		});

		// After setting default layout, save it
		saveLayout();
	}
}

// Function to check if elements overlap
function checkForOverlaps() {
	const elements = document.querySelectorAll('.control-element');
	const elementRects = [];

	// Get all element boundaries
	elements.forEach(element => {
		const rect = element.getBoundingClientRect();
		elementRects.push({
			element: element,
			left: rect.left,
			right: rect.right,
			top: rect.top,
			bottom: rect.bottom
		});
	});

	// Check each element against all others
	for (let i = 0; i < elementRects.length; i++) {
		for (let j = i + 1; j < elementRects.length; j++) {
			const a = elementRects[i];
			const b = elementRects[j];

			// Check if elements overlap
			if (!(a.right < b.left ||
				a.left > b.right ||
				a.bottom < b.top ||
				a.top > b.bottom)) {
				console.warn('Overlap detected between',
					a.element.id, 'and', b.element.id);

				// Add a visual indicator (for debugging)
				a.element.style.borderColor = 'red';
				b.element.style.borderColor = 'red';
			}
		}
	}
}

// Add this to end of window.onload to verify no overlaps
function verifyNoOverlaps() {
	// Use setTimeout to ensure layout is completed
	setTimeout(checkForOverlaps, 500);
}

// Save the selected control type when it changes
document.getElementById('inputType').addEventListener('change', function() {
	const selectedType = this.value;
	localStorage.setItem('controlType', selectedType);
	// Optionally, update the UI based on the selection
	changeInputType();
});

// On page load, set the select to the saved control type (if any)
function loadControlType() {
	const savedType = localStorage.getItem('controlType');
	if (savedType) {
		document.getElementById('inputType').value = savedType;
		changeInputType(); // Update the UI accordingly
	}
}

// Add this to ensure layout adapts to screen size changes
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

window.addEventListener('resize', () => {
	// Only trigger if size change is significant (>20%)
	const widthChange = Math.abs(window.innerWidth - lastWidth) / lastWidth;
	const heightChange = Math.abs(window.innerHeight - lastHeight) / lastHeight;

	if (widthChange > 0.2 || heightChange > 0.2) {
		// Update last dimensions
		lastWidth = window.innerWidth;
		lastHeight = window.innerHeight;

		// If in edit mode, offer to reset layout
		if (isEditMode && confirm('Screen size changed significantly. Reset layout?')) {
			localStorage.removeItem('controllerLayout');
			setDefaultLayout();
			applyRotations();
		}
	}
});

// Initialize
window.onload = () => {
	// Initialize aspect ratios first
	initAspectRatios();

	// Load saved preferences
	loadControlType();
	loadLayout();

	// If no saved layout, set default grid-based layout
	setDefaultLayout();

	// Apply other settings
	applyRotations();
	changeInputType();
	updateControlInteractivity();

	// Wait for layout to settle, then check for overlaps
	setTimeout(() => {
		// Only for development/debugging
		// checkForOverlaps();

	  // Finally toggle to use mode
	  toggleMode();
  }, 100);
};
