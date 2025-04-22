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
				formMessage.style.display = 'block';
				formMessage.textContent = "Setup successful, comrade! Press the button below to apply the changes.";
				formMessage.style.color = 'var(--green-success)';
				document.getElementById('restartButton').style.display = 'block';
			} else {
				formMessage.style.display = 'block';
				formMessage.textContent = result.message || 'An error occurred. Please try again.';
				formMessage.style.color = 'var(--red-warning)';
				document.getElementById('restartButton').style.display = 'none';
			}
		})
		.catch(error => {
			console.error('Error:', error);
			formMessage.style.display = 'block';
			formMessage.textContent = 'An error occurred. Please try again.';
			formMessage.style.color = 'var(--red-warning)';
		});
});

function validatePassword(password) {
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
	return passwordRegex.test(password);
}

async function requestRestart() {
	await fetch('/restart', { method: 'POST' })
		.then(response => response.json())
		.then(data => {
			if (data.status === 'ok') {
				alert("Palooka is restarting, comrade...");
			} else {
				alert("Error restarting Palooka.");
			}
		})
		.catch(error => {
			console.error('Error:', error);
			alert("An error occurred while attempting to restart the Palooka, comrade!");
		});
}

async function calibrateBattery() {
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
