// Change between joystick and sliders
document.getElementById('inputType').addEventListener('change', changeInputType);

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

// Save the selected control type when it changes
document.getElementById('inputType').addEventListener('change', function() {
	const selectedType = this.value;
	localStorage.setItem('controlType', selectedType);
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

