import { saveLayout } from './controller.js';
import { initJoystick } from './joystick.js';

export let isEditMode = false;
let activeElement = null;
let isResizing = false;
let isRotating = false;
let startX, startY, startWidth, startHeight, startLeft, startTop, startRotation;

export function toggleMode() {
	isEditMode = !isEditMode;
	document.getElementById('controller').classList.toggle('edit-mode');
	saveLayout();
	updateControlInteractivity();
	if (!isEditMode) {
		initJoystick();
	}
}

// Update interactive controls based on mode.
export function updateControlInteractivity() {
	// Disable interactive child elements in edit mode
	document.querySelectorAll('.control-button, .slider, .joystick, .joystick-handle').forEach(el => {
		el.style.pointerEvents = isEditMode ? 'none' : 'auto';
	});
}

export function startDrag(e) {
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
