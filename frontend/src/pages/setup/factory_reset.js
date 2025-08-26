import Modal from '@/utils/Modal.js';

window.handleFactoryReset = function handleFactoryReset() {
	const modal = new Modal({
		title: "Factory Reset",
		message: "Are you sure you want to reset to factory settings?",
		buttons: Modal.Buttons.YES_CANCEL,
		onConfirm: fetchResetEndpoint,
		dataColor: 'red'
	});
	modal.showModal();
}

async function fetchResetEndpoint() {
	const statusModal = new Modal({
		title: "Resetting...",
		message: "Please wait while the device resets.",
		buttons: Modal.Buttons.CONFIRM_ONLY,
		yesBtnText: "Close"
	});
	statusModal.showModal();

	try {
		const response = await fetch("/factoryReset", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const result = await response.json();
		statusModal.destroyModal();

		const successModal = new Modal({
			title: "Reset Successful",
			message: result.message || "Factory reset successful. Restarting... You will need to reconnect to our device.",
			buttons: Modal.Buttons.CONFIRM_ONLY,
			yesBtnText: "OK"
		});
		successModal.showModal();

	} catch (error) {
		console.error("Factory reset failed:", error);
		statusModal.destroyModal();

		const errorModal = new Modal({
			title: "Reset Failed",
			message: "An error occurred during factory reset. Check console for details.",
			buttons: Modal.Buttons.CONFIRM_ONLY,
			yesBtnText: "Close",
			dataColor: 'red'
		});
		errorModal.showModal();
	}
	localStorage.removeItem('controllerLayout');
}
