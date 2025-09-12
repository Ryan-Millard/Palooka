export async function calibrateBattery() {
	try {
		const response = await fetch('/calibrateBattery', { method: 'GET' });
		if (!response.ok) {
			throw new Error(`Network response was not ok: ${response.statusText}`);
		}
		const result = await response.json(); // parse JSON
		console.log('Battery calibration response:', result);

		// Check if success is true
		return result.success === true;
	} catch (error) {
		console.error('Error during battery calibration:', error);
		return false;
	}
}
