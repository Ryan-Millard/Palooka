import Modal from '@/utils/Modal.js';
import { calibrateBattery } from './battery.js';
import { setupFormSubmissionHandler } from './forms.js';
import { handleFactoryReset } from './factory_reset.js';
import { setupBatteryWebsocket } from '@/utils/battery_websocket.js';

setupBatteryWebsocket();

// Battery calibration
document.getElementById('battery-calibrator').addEventListener('click', () => {
	const confirmCallback = async () => {
		const succeeded = await calibrateBattery();
		const modal = new Modal({
			title: succeeded ? "Success" : "Failure",
			message: succeeded ? "Our battery has been calibrated comrade!" : "System error - please try again comrade.",
			buttons: Modal.Buttons.CONFIRM_ONLY,
			yesBtnText: "Close",
		});
		if (!succeeded) modal.dataColor = "red";
		modal.showModal();
	};

	new Modal({
		title: "Calibrate Battery",
		message: "Before calibrating, ensure the Palooka is not charging, comrade!",
		buttons: Modal.Buttons.YES_CANCEL,
		yesBtnText: "Calibrate",
		onConfirm: confirmCallback
	}).showModal();
});

// Change logo to red color & apply in correct place
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

// Setup form submissions
document.getElementById('setup-form').addEventListener('submit', setupFormSubmissionHandler);

document.getElementById('factory-reset-button').addEventListener('click', handleFactoryReset);
