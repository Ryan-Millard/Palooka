export function resetLayout() {
	// Remove any custom layout from localStorage
	localStorage.removeItem('controllerLayout');

	// Re-apply the built-in default positions and sizes
	setDefaultLayout();

	// Re-apply stored rotations (setDefaultLayout sets rotations to defaults)
	applyRotations();

	// Ensure controls are enabled/disabled correctly for the current mode
	updateControlInteractivity();
}

// Apply rotations from stored data
export function applyRotations() {
	document.querySelectorAll('.control-element').forEach(element => {
		const rotation = element.getAttribute('data-rotation') || '0';
		element.style.transform = `rotate(${rotation}deg)`;
	});
}

// Factory Default layout
export function setDefaultLayout() {
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
		sliderLeft.style.top = (cellHeight * 3.5) + padding + 'px';
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

// Initialize aspect ratios for buttons (and other elements if needed)
export function initAspectRatios() {
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
