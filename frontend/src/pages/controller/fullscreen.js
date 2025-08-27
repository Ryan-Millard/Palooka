export function toggleFullscreen(element = document.body) {
	// Check if fullscreen is currently active
	const isFullscreen = document.fullscreenElement ||
		document.webkitFullscreenElement ||
		document.mozFullScreenElement ||
		document.msFullscreenElement;

	// Toggle based on current state
	if (!isFullscreen) {
		enterFullscreen(element);
	} else {
		exitFullscreen();
	}
}

function enterFullscreen(element = document.body) {
	if (element.requestFullscreen) {
		element.requestFullscreen().catch(err => {
			console.error('Error entering fullscreen:', err);
		});
	} else if (element.webkitRequestFullscreen) { /* Safari */
		element.webkitRequestFullscreen();
	} else if (element.mozRequestFullScreen) { /* Firefox */
		element.mozRequestFullScreen();
	} else if (element.msRequestFullscreen) { /* IE/Edge */
		element.msRequestFullscreen();
	}
}

function exitFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.webkitExitFullscreen) { /* Safari */
		document.webkitExitFullscreen();
	} else if (document.mozCancelFullScreen) { /* Firefox */
		document.mozCancelFullScreen();
	} else if (document.msExitFullscreen) { /* IE/Edge */
		document.msExitFullscreen();
	}
}
