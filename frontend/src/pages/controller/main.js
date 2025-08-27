import { toggleMode } from './toggle_edit_mode.js';
import { toggleFullscreen } from './fullscreen.js';
import { changeInputType } from './switch_control_type.js';
import {
	initAspectRatios,
	loadControlType,
	loadLayout,
	setDefaultLayout,
	applyRotations,
	updateControlInteractivity,
} from './controller.js';
import { sendFlipData, sendSliderData } from './controller_web_socket.js';
import { setupBatteryWebsocket } from './battery_web_socket.js';
import { handleResetBtnClick } from './reset_controller_layout.js';
import { editText } from './edit_text.js';

// Allow HTML to manage it
window.editText = editText;

// Updates battery UI
setupBatteryWebsocket();

// Joystick/Slider option
const controllerEditToggler = document.getElementById("controller-edit-toggler");
controllerEditToggler.addEventListener('click', () => {
	toggleMode();
	controllerEditToggler.textContent = (controllerEditToggler.textContent === "Edit") ? "Save" : "Edit";
});

// Fullscreen
const fsOpener = document.getElementById("control-panel-open-fullscreen");
fsOpener.addEventListener('click', () => {
	toggleFullscreen(document.getElementById('controls-container'));
	fsOpener.src = fsOpener.src.endsWith("open-fullscreen.svg") ? "img/close-fullscreen.svg" : "img/open-fullscreen.svg";
});

// Settings modal
document.getElementById("control-panel-settings").addEventListener('click', () => {
	document.getElementById("settings-modal").style.display = 'flex';
});

// Control options in settings modal
const radios = document.querySelectorAll('input[name="inputType"]')
const prevVal = localStorage.getItem('controlType') ?? 'joystick';
const prevRadio = document.querySelector(`input[name="inputType"][value="${prevVal}"]`);
if (prevRadio) prevRadio.checked = true;
radios.forEach(radio => radio.addEventListener('change', (e) => {
	localStorage.setItem('controlType', e.target.value);
	changeInputType();
}));

window.isEditMode = false;
// Resize listener on window
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

// Set up controller
window.onload = () => {
	document.getElementById('controller').classList.toggle('edit-mode', isEditMode);
	initAspectRatios();
	loadControlType();
	loadLayout();
	setDefaultLayout();
	applyRotations();
	updateControlInteractivity();
};

// Flip button listener
document.getElementById('flipButton').addEventListener('click', sendFlipData);

// Register all for sliders
document.querySelectorAll('.slider').forEach(slider => {
	const id = slider.dataset.id; // 'F', 'R', 'L', etc.

	slider.addEventListener('input', () => sendSliderData(id, slider.value));

	const reset = () => {
		slider.value = 0;
		sendSliderData(id, 0);
	};

	slider.addEventListener('mouseup', reset);
	slider.addEventListener('touchend', reset);
});

// Reset controller settings
document.getElementById('reset-controller-to-factory-settings').addEventListener('click', handleResetBtnClick);

// Change danger logo to red color
fetch('img/star.svg')
	.then(r => r.text())
	.then(svgText => {
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
		// Change all fills from #0fc to red
		svgDoc.querySelectorAll('[fill="#0fc"]').forEach(el => {
			el.setAttribute('fill', 'var(--red)');
		});

		const svgEl = svgDoc.documentElement;
		svgEl.classList.add('small-flag');

		// Inject into page
		document.getElementById('star-container')
			.appendChild(svgDoc.documentElement);
	})
	.catch(console.error);
