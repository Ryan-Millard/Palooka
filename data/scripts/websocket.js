export class WebSocketClient {
  /**
   * Create a new WebSocketClient.
   * @param {string} url - The WebSocket server URL.
   * @param {string | string[]} [protocols] - Optional protocols.
   * @param {number} [reconnectInterval=5000] - Interval (in ms) between reconnection attempts.
   * @param {number} [maxReconnectAttempts=10] - Maximum number of reconnection attempts.
   */
  constructor(url, protocols, reconnectInterval = 5000, maxReconnectAttempts = 10) {
    this.url = url || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}:81`;
    this.protocols = protocols;
    this.ws = null;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectAttempts = 0;

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

    console.log('WebSocketClient connecting...');
    this.ws = new WebSocket(this.url, this.protocols);

    this.ws.onopen = (event) => {
      console.log(`Connected to ${this.url}`);
      this.reconnectAttempts = 0; // Reset reconnection attempts on successful connection
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
      this.handleReconnection();
    };
  }

  /**
   * Handle reconnection attempts.
   */
  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnection attempts reached. No further attempts will be made.');
    }
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
   * @param {number} [code] - Status code explaining why the connection is being closed
   * @param {string} [reason] - A human-readable string explaining why the connection is closing
   */
  close(code, reason) {
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }
}

// Export a singleton instance with a specific URL
const wsClient = new WebSocketClient();
export default wsClient;
