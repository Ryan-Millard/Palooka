#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <LittleFS.h>

#include "FileSystem.h"

WebServer server(80); // On port 80
WebSocketsServer webSocket(81); // On port 81

// Function to generate the SSID with MAC address
String generateSSID() {
	uint8_t mac[6];
	WiFi.macAddress(mac);
	char macStr[18];
	snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
	return String("Palooka_") + macStr;
}

void setup() {
	Serial.begin(115200);

	// Initialize LittleFS
	if(!FileSystem::FSManager::begin()) {
		return;
	}

	// Generate SSID with MAC address
	String ssid = generateSSID();

	// Start the ESP32 as an access point
	WiFi.softAP(ssid.c_str());

	// Print the SSID and IP address
	Serial.println("Access Point Started");
	Serial.println("SSID: " + ssid);
	Serial.println("IP Address: " + WiFi.softAPIP().toString());

	// TODO: implement serve static files for server

	// Serve static files
	server.on("/", HTTP_GET, []() {
		File file = FileSystem::FSManager::getFile("/index.html");
		serveFile(file, "text/html");
	});

	server.on("/index.css", HTTP_GET, []() {
		File file = FileSystem::FSManager::getFile("/index.css");
		serveFile(file, "text/css");
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
void serveFile(File& file, const char* contentType) {
	Serial.print("Attempting to serve");

	if (!file || file.isDirectory()) {
		if(file)
		{
			file.close();
		}
		server.send(404, "text/plain", "File not found");
		return;
	}

	Serial.print("File found, size: ");
	Serial.println(file.size());
	server.streamFile(file, contentType);
	file.close(); // Explicit close after streaming
}
