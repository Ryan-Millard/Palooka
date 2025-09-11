import { calibrateBattery } from './battery.js';
import { setupFormSubmissionHandler } from './forms.js';
import { handleFactoryReset } from './factory_reset.js';
import { setupBatteryWebsocket } from '@/utils/battery_websocket.js';

setupBatteryWebsocket();

// Battery calibration
document.getElementById('battery-calibrator').addEventListener('click', calibrateBattery);

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
