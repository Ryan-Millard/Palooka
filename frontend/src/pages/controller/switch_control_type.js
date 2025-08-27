import { initJoystick } from './controller.js';

// Input Type Change: show/hide joystick and slider elements
export function changeInputType() {
	const checkedRadio = document.querySelector('input[name="inputType"]:checked');
	const type = checkedRadio ? checkedRadio.value : 'joystick';
	document.getElementById('joystickControl').style.display = type === 'joystick' ? 'block' : 'none';
	document.querySelectorAll('.slider-element').forEach(el => {
		el.style.display = type === 'sliders' ? 'block' : 'none';
	});
	if (type === 'joystick' && !isEditMode) {
		initJoystick();
	}
}
