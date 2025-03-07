#include "AccessPoint.h"

namespace PalookaNetwork
{
	// Public
	bool AccessPoint::begin()
	{
		if(!FileSystem::FSManager::begin()) // Initialize LittleFS
		{
			return false;
		}

		if(!WiFi.softAP(SSID.c_str())) // Start the ESP32 as an access point
		{
			Serial.println("Failed to start Access Point");
			return false;
		}

		Serial.println("Access Point Started");
		Serial.println("SSID: " + SSID);
		Serial.println("IP Address: " + WiFi.softAPIP().toString());

		serverSetup();

		server.begin(); // Start the web server

		webSocket.begin(); // Start the WebSocket server

		return true;
	}

	void AccessPoint::handleClients()
	{
		server.handleClient();
		webSocket.loop();
	}

	// Private
	const String AccessPoint::generateSSID(const String& SSID_BASE)
	{
		uint8_t mac[6];
		WiFi.macAddress(mac);
		char macStr[18];
		snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
		return SSID_BASE + macStr;
	}

	void AccessPoint::serverSetup()
	{
		// Serve static files
		server.on("/", HTTP_GET, [this]() {
			serveFile("/index.html", "text/html");
		});

		server.on("/styles/index.css", HTTP_GET, [this]() {
			serveFile("/styles/index.css", "text/css");
		});

		server.on("/controller", HTTP_GET, [this]() {
			serveFile("/controller.html", "text/html");
		});
		server.on("/styles/controller.css", HTTP_GET, [this]() {
			serveFile("/styles/controller.css", "text/css");
		});
		server.on("/scripts/controller.js", HTTP_GET, [this]() {
			serveFile("/scripts/controller.js", "text/js");
		});

		server.on("/setup", HTTP_GET, [this]() {
			serveFile("/setup.html", "text/html");
		});
		server.on("/styles/setup.css", HTTP_GET, [this]() {
			serveFile("/styles/setup.css", "text/css");
		});
	}

	void AccessPoint::serveFile(const char* filePath, const char* contentType)
	{
		File file = FileSystem::FSManager::getFile(filePath);
		if(!file || file.isDirectory())
		{
			if(file) { file.close(); }

			server.send(404, "text/plain", "File not found");
			return;
		}

		Serial.print("Serving file: ");
		Serial.print(filePath);
		Serial.print(", size: ");
		Serial.println(file.size());
		server.streamFile(file, contentType);
		file.close(); // Explicit close after streaming
	}
}
