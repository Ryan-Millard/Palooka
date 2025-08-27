import { saveLayout, initJoystick, updateControlInteractivity } from './controller.js';

export function toggleMode() {
	isEditMode = !isEditMode;
	document.getElementById('controller').classList.toggle('edit-mode');
	saveLayout();
	updateControlInteractivity();
	if (!isEditMode) {
		initJoystick();
	}
}
