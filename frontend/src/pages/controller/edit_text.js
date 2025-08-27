import Modal from '@/utils/Modal.js';

export function editText(elementId) {
	const element = document.getElementById(elementId);
	const currentText = element.textContent || element.innerText;
	console.log(currentText);

	// Prompt the user to edit the text
	const modal = new Modal({
		title: "Edit Text",
		message: "",
		buttons: Modal.Buttons.YES_CANCEL,
		onConfirm: () => {
			const newText = document.getElementById('newText').value;
			// If the user provided new text, update the element
			if (newText !== null) {
				element.textContent = newText;
			}
		},
		customHTML: `
			<label for="newText">Device Name:</label>
			<input type="text" id="newText" class="textInput" placeholder="${currentText.replace(/"/g, '&quot;')}">
		`
	});
	modal.showModal();
}
