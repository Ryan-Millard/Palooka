export async function calibrateBattery() {
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
