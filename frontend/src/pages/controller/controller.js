import { changeInputType } from './switch_control_type.js';
import { sendJoystickData } from './web_socket_manager.js';

export function saveLayout() {
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

export function loadLayout() {
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

// On page load, set the select to the saved control type (if any)
export function loadControlType() {
	const savedType = localStorage.getItem('controlType');
	if (savedType) {
		changeInputType(); // Update the UI accordingly
	}
}
