import requestRestart from './request_restart.js';

document.getElementById('setup-form').addEventListener('submit', async function(e) {
	e.preventDefault();
	const name = document.getElementById('name').value;
	const password = document.getElementById('password').value;
	const formMessage = document.getElementById('form-message');

	// Clear previous messages
	formMessage.style.display = 'none';
	formMessage.textContent = '';

	// Frontend Password Validation
	const isValidPassword = validatePassword(password);
	if (!isValidPassword) {
		formMessage.style.display = 'block';
		formMessage.textContent = "That's a bad password, comrade!";
		return;
	}

	const data = { name, password };
	await fetch('/setup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
		.then(response => response.json())
		.then(result => {
			if (result.status === 'ok') {
				requestRestart();
			} else {
				formMessage.style.display = 'block';
				formMessage.textContent = result.message || 'An error occurred. Please try again.';
				formMessage.style.color = 'var(--red)';
				document.getElementById('restartButton').style.display = 'none';
			}
		})
		.catch(error => {
			console.error('Error:', error);
			formMessage.style.display = 'block';
			formMessage.textContent = 'An error occurred. Please try again.';
			formMessage.style.color = 'var(--red)';
		});
});

window.validatePassword = function validatePassword(password) {
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
	return passwordRegex.test(password);
}

window.calibrateBattery = async function calibrateBattery() {
	try {
		const response = await fetch('/calibrateBattery', { method: 'GET' });
		if (!response.ok) {
			throw new Error(`Network response was not ok: ${response.statusText}`);
		}
		const result = await response.text();
		console.log('Battery calibration initiated:', result);
	} catch (error) {
		console.error('Error during battery calibration:', error);
	}
}
