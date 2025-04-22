import Modal from './Modal.js';

window.requestRestart = async function requestRestart() {
	try {
		const response = await fetch('/restart', { method: 'POST' });
		const data = await response.json();

		const modal = new Modal({
			title: data.status === 'ok' ? "Restarting..." : "Error",
			message: data.status === 'ok'
				? "Palooka is restarting, comrade..."
				: "Error restarting Palooka.",
			buttons: Modal.Buttons.CONFIRM_ONLY,
			yesBtnText: "OK"
		});

		modal.showModal();
	} catch (error) {
		console.error('Error:', error);
		alert("An error occurred while attempting to restart the Palooka, comrade!");
	}
}
