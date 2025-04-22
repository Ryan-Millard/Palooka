let isEditMode = true;
let activeElement = null;
let isResizing = false;
let isRotating = false;
let startX, startY, startWidth, startHeight, startLeft, startTop, startRotation;
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let maxJoystickDistance = 0;

function resetLayout() {
    // Remove any custom layout from localStorage
    localStorage.removeItem('controllerLayout');

    // Re-apply the built-in default positions and sizes
    setDefaultLayout();

    // Re-apply stored rotations (setDefaultLayout sets rotations to defaults)
    applyRotations();

    // Ensure controls are enabled/disabled correctly for the current mode
    updateControlInteractivity();
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

document.querySelectorAll('.control-element').forEach(element => {
	element.addEventListener('pointerdown', startDrag);
	element.addEventListener('touchstart', startDrag, { passive: false });
});

function startDrag(e) {
	if (!isEditMode) return;
	// Prevent dragging when interacting with interactive controls in edit mode.
	if (e.target.classList.contains('control-button') ||
		e.target.classList.contains('slider') ||
		e.target.classList.contains('joystick') ||
		e.target.classList.contains('joystick-handle') ||
		e.target.classList.contains('edit-text')) {
		return;
	}
	e.preventDefault();

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
		if (activeElement.classList.contains('joystick-element')) {
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
		joystick.style.width = '50%'; // Height will be the same since it is square

		// SLIDER LEFT - takes up 1 column, row 3
		const sliderLeft = document.getElementById('sliderLeft');
		sliderLeft.style.left = padding + 'px';
		sliderLeft.style.width = (cellWidth * 2) - (padding * 2) + 'px';
		sliderLeft.style.height = cellHeight - (padding * 2) + 'px';

		// FLIPPER SLIDER - takes up 1 column, row 4
		const sliderCenter = document.getElementById('sliderCenter');
		sliderCenter.style.left = padding + 'px';
		sliderCenter.style.top = (cellHeight * 2.5) + padding + 'px';
		sliderCenter.style.width = (cellWidth * 2) - (padding * 2) + 'px';
		sliderCenter.style.height = cellHeight - (padding * 2) + 'px';

		// SLIDER RIGHT - takes up 1 column, row 5
		const sliderRight = document.getElementById('sliderRight');
		sliderRight.style.left = padding + 'px';
		sliderRight.style.top = (cellHeight * 3.5) + padding + 'px';
		sliderRight.style.width = (cellWidth * 2) - (padding * 2) + 'px';
		sliderRight.style.height = cellHeight - (padding * 2) + 'px';

		// BATTERY - top right corner
		// This gets rotated 90deg, so it looks strange
		const batteryContainer = document.getElementById('batteryContainer');
		batteryContainer.style.left = (cellWidth * 2) + padding + 'px';
		batteryContainer.style.top = cellHeight/2 + 'px';
		batteryContainer.style.width = cellWidth - (padding * 2) + 'px';
		batteryContainer.style.height = cellHeight - (padding * 2) + 'px';

		// BUTTON 2 - below button 1
		// This gets rotated 90deg, so it looks strange
		const flipButtonContainer = document.getElementById('flipButtonContainer');
		flipButtonContainer.style.left = (cellWidth * 2) + padding + 'px';
		flipButtonContainer.style.top = 2*cellHeight + 'px';
		flipButtonContainer.style.width = cellWidth - (padding * 2) + 'px';
		flipButtonContainer.style.height = cellHeight - (padding * 2) + 'px';

		function rotateAndSetAspectRatio(elements, rotationDegrees = 90) {
			elements.forEach(element => {
				element.setAttribute('data-rotation', rotationDegrees);
				element.style.transform = `rotate(${rotationDegrees}deg)`;

				const width = parseInt(element.style.width);
				const height = parseInt(element.style.height);

				if (!isNaN(width) && !isNaN(height) && height > 0) {
					const aspectRatio = width / height;
					element.setAttribute('data-aspect-ratio', aspectRatio.toFixed(4));
				}
			});
		}
		rotateAndSetAspectRatio([joystick, batteryContainer, flipButtonContainer], 90);
		rotateAndSetAspectRatio([sliderLeft, sliderCenter, sliderRight], 0);

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
	updateControlInteractivity();

	// Wait for layout to settle, then check for overlaps
	setTimeout(() => {
		// Only for development/debugging
		// checkForOverlaps();

		// Finally toggle to use mode
		toggleMode();
	}, 100);
};
