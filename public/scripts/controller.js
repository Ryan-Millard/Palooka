const hostName = window.location.hostname ?? "192.168.4.1";
const ws = new WebSocket("ws://" + hostName + ":81"); // IP of the ESP32 AP, port 81

let isEditMode = true;
let activeElement = null;
let isResizing = false;
let startX, startY, startWidth, startHeight, startLeft, startTop;
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let maxJoystickDistance = 0;

// Mode Toggle
document.getElementById('inputType').addEventListener('change', changeInputType);

function updateMotor(motor, value) {
	const data = JSON.stringify({ motor, value });
	console.log(data);
	ws.send(data);
}

// Send joystick data to the ESP32
function sendJoystickData(x, y) {
	const data = JSON.stringify({ x, y });
	console.log(data);
	ws.send(data);
}

function toggleMode() {
	isEditMode = !isEditMode;
	document.getElementById('controller').classList.toggle('edit-mode');
	document.getElementById('modeToggle').textContent = 
		isEditMode ? 'Save Layout' : 'Edit Layout';
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
	activeElement = e.currentTarget;
	startX = e.clientX || (e.touches && e.touches[0].clientX);
	startY = e.clientY || (e.touches && e.touches[0].clientY);

	const computedStyle = window.getComputedStyle(activeElement);
	startWidth = parseInt(computedStyle.width);
	startHeight = parseInt(computedStyle.height);
	startLeft = parseInt(computedStyle.left);
	startTop = parseInt(computedStyle.top);

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

	if (isResizing) {
		// Resize with aspect ratio for button, joystick, and slider elements if applicable
		if (activeElement.classList.contains('button-element') ||
			activeElement.classList.contains('joystick-element') ||
			activeElement.classList.contains('slider-element')) {
			const aspectRatio = parseFloat(activeElement.getAttribute('data-aspect-ratio'));
			let newWidth = Math.max(40, startWidth + deltaX);
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
			let newWidth = Math.max(40, startWidth + deltaX);
			let newHeight = Math.max(40, startHeight + deltaY);
			const maxWidth = containerRect.width - startLeft;
			const maxHeight = containerRect.height - startTop;
			newWidth = Math.min(newWidth, maxWidth);
			newHeight = Math.min(newHeight, maxHeight);
			activeElement.style.width = newWidth + 'px';
			activeElement.style.height = newHeight + 'px';
		}
	} else {
		// Drag: update position and keep element within container bounds
		let newLeft = startLeft + deltaX;
		let newTop = startTop + deltaY;
		const elementWidth = activeElement.offsetWidth;
		const elementHeight = activeElement.offsetHeight;
		newLeft = Math.max(0, Math.min(newLeft, containerRect.width - elementWidth));
		newTop = Math.max(0, Math.min(newTop, containerRect.height - elementHeight));
		activeElement.style.left = newLeft + 'px';
		activeElement.style.top = newTop + 'px';
	}
}

function stopDrag(e) {
	activeElement = null;
	isResizing = false;
	document.removeEventListener('pointermove', handleDrag);
	document.removeEventListener('pointerup', stopDrag);
	document.removeEventListener('touchmove', handleDrag);
	document.removeEventListener('touchend', stopDrag);
	saveLayout();
}
// --- End New Drag Logic ---

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
	const handle = document.querySelector('.joystick-handle');
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
	const deltaX = relX - joystickCenter.x;
	const deltaY = relY - joystickCenter.y;
	const angle = Math.atan2(deltaY, deltaX);
	const distance = Math.min(maxJoystickDistance, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
	const newX = distance * Math.cos(angle);
	const newY = distance * Math.sin(angle);
	handle.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
	const joystickX = newX / maxJoystickDistance;
	const joystickY = newY / maxJoystickDistance;
	sendJoystickData(joystickX, joystickY);
}

function stopJoystickMouse() {
	if (!joystickActive) return;
	resetJoystick();
	document.removeEventListener('mousemove', moveJoystickMouse);
	document.removeEventListener('mouseup', stopJoystickMouse);
}

function stopJoystickTouch() {
	if (!joystickActive) return;
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

// Button functionality for Use Mode
document.querySelectorAll('.control-button').forEach(button => {
	button.addEventListener('mousedown', buttonPress);
	button.addEventListener('mouseup', buttonRelease);
	button.addEventListener('touchstart', buttonPress, { passive: false });
	button.addEventListener('touchend', buttonRelease);
});

function buttonPress(e) {
	if (isEditMode) return;
	if (e.type === 'touchstart') e.preventDefault();
	console.log(`Button ${this.textContent} pressed`);
}

function buttonRelease() {
	if (isEditMode) return;
	console.log(`Button ${this.textContent} released`);
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
			aspectRatio: element.getAttribute('data-aspect-ratio') || 'auto'
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
				}
			});
		} catch (e) {
			console.error('Error loading saved layout', e);
		}
	}
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

// Initialize
window.onload = () => {
	initAspectRatios();
	loadControlType();
	loadLayout();
	changeInputType();
	updateControlInteractivity();
	toggleMode();
};
