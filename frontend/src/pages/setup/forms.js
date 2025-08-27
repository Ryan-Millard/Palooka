import { validatePassword } from './password.js';

export async function setupFormSubmissionHandler(e) {
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
}
