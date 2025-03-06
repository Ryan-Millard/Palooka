#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <LittleFS.h>

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
	return String("Palooka ") + macStr;
}

void setup() {
	Serial.begin(115200);

	// Initialize LittleFS
	if(!LittleFS.begin(true)) {
		Serial.println("An Error has occurred while mounting LittleFS");
		return;
	}
	Serial.println("LittleFS mounted successfully");

	// Generate SSID with MAC address
	String ssid = generateSSID();

	// Start the ESP32 as an access point
	WiFi.softAP(ssid.c_str());

	// Print the SSID and IP address
	Serial.println("Access Point Started");
	Serial.println("SSID: " + ssid);
	Serial.println("IP Address: " + WiFi.softAPIP().toString());

	// Serve static files
	server.on("/", HTTP_GET, []() {
			serveFile("/index.html", "text/html");
			});

	server.on("/index.css", HTTP_GET, []() {
			serveFile("/index.css", "text/css");
			});

	// Start the web server
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

// Function to serve files from LittleFS
void serveFile(const char* path, const char* contentType) {
	Serial.print("Attempting to serve: ");
	Serial.println(path);

	File file = LittleFS.open(path, "r");
	if (!file) {
		Serial.println("File not found!");
		server.send(404, "text/plain", "File not found");
		return;
	}

	Serial.print("File found, size: ");
	Serial.println(file.size());
	server.streamFile(file, contentType);
	file.close();
}
