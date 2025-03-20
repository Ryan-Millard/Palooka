export class WebSocketClient {
	/**
	 * Create a new WebSocketClient.
	 * @param {string} url - The WebSocket server URL.
	 * @param {string | string[]} [protocols] - Optional protocols.
	 */
	constructor(url, protocols) {
		this.url =
			url ?? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
		this.protocols = protocols;
		this.ws = null;

		// Delegate containers: arrays for each type of event.
		this.onOpenCallbacks = [];
		this.onMessageCallbacks = [];
		this.onErrorCallbacks = [];
		this.onCloseCallbacks = [];
	}

	/**
	 * Connect to the WebSocket server.
	 */
	connect() {
		// Check if a connection is already active or in the process of connecting.
		if (this.ws &&
			(this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
			return;
		}

		this.ws = new WebSocket(this.url, this.protocols);

		this.ws.onopen = (event) => {
			console.log(`Connected to ${this.url}`);
			this.onOpenCallbacks.forEach((cb) => cb(event));
		};

		this.ws.onmessage = (event) => {
			console.log('Received message:', event.data);
			this.onMessageCallbacks.forEach((cb) => cb(event.data));
		};

		this.ws.onerror = (event) => {
			console.error('WebSocket error:', event);
			this.onErrorCallbacks.forEach((cb) => cb(event));
		};

		this.ws.onclose = (event) => {
			console.log('WebSocket connection closed.');
			this.onCloseCallbacks.forEach((cb) => cb(event));
		};
	}

	/**
	 * Add a callback for the open event.
	 * @param {Function} callback
	 */
	addOnOpen(callback) {
		if (typeof callback === 'function') {
			this.onOpenCallbacks.push(callback);
		}
	}

	/**
	 * Add a callback for the message event.
	 * @param {Function} callback
	 */
	addOnMessage(callback) {
		if (typeof callback === 'function') {
			this.onMessageCallbacks.push(callback);
		}
	}

	/**
	 * Add a callback for the error event.
	 * @param {Function} callback
	 */
	addOnError(callback) {
		if (typeof callback === 'function') {
			this.onErrorCallbacks.push(callback);
		}
	}

	/**
	 * Add a callback for the close event.
	 * @param {Function} callback
	 */
	addOnClose(callback) {
		if (typeof callback === 'function') {
			this.onCloseCallbacks.push(callback);
		}
	}

	/**
	 * Send data through the WebSocket connection.
	 * @param {*} data - The data to be sent.
	 */
	send(data) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(data);
		} else {
			console.error('WebSocket is not open. Unable to send message.');
		}
	}

	/**
	 * Close the WebSocket connection.
	 */
	close(code, reason) {
		if (this.ws) {
			this.ws.close(code, reason);
		}
	}
}

const wsClient = new WebSocketClient();
export default wsClient;
