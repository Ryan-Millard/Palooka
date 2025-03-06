#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>

// Web server running on port 80
WebServer server(80);

// WebSocket server running on port 81
WebSocketsServer webSocket(81);

// Function to generate the SSID with MAC address
String generateSSID() {
	uint8_t mac[6];
	WiFi.macAddress(mac);
	char macStr[18];
	snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
	return String("ESP32_") + macStr;
}

void setup() {
	Serial.begin(115200);

	// Generate SSID with MAC address
	String ssid = generateSSID();

	// Start the ESP32 as an access point
	WiFi.softAP(ssid.c_str());

	// Print the SSID and IP address
	Serial.println("Access Point Started");
	Serial.println("SSID: " + ssid);
	Serial.println("IP Address: " + WiFi.softAPIP().toString());

	// Start the web server
	server.on("/", handleRoot);
	server.begin();

	// Start the WebSocket server
	webSocket.begin();
}

void loop() {
	// Handle client requests
	server.handleClient();

	// Handle WebSocket events
	webSocket.loop();
}

// Handle root URL
void handleRoot() {
	server.send(200, "text/plain", "Hello from ESP32!");
}
