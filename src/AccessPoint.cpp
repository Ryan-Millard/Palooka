#include "AccessPoint.h"
#include "RobotTaskManager.h"

namespace PalookaNetwork
{
	// Public
	AccessPoint::AccessPoint(const Route* routes, const size_t num_routes,
			uint16_t webServerPort, uint16_t webSocketPort,
			const uint16_t dnsServerPort,
			const String& SSID_BASE)
		: SSID(generateSSID(SSID_BASE)),
		ROUTES(routes), NUM_ROUTES(num_routes),
		server(webServerPort), webSocket(webSocketPort),
		DNS_SERVER_PORT(dnsServerPort)
	{}

	bool AccessPoint::begin()
	{
		if(!LittleFS.begin()) // Initialize LittleFS
		{
			return false;
		}

		Preferences preferences;
		// Initialize preferences with the namespace "MyApp"
		preferences.begin("Palooka", false);  // Read-write mode

		String AP_Name = preferences.getString("AP_Name", SSID.c_str()); // SSID is default SSID for the AP
		String AP_Password = preferences.getString("AP_Password", ""); // No password as the default

		preferences.end(); // Close the preferences

		if(!WiFi.softAP(AP_Name, AP_Password)) // Start the ESP32 as an access point
		{
			Serial.println("Failed to start Access Point");
			return false;
		}

		// Start the DNS server to redirect all domain requests to the AP's IP.
		dnsServer.start(DNS_SERVER_PORT, "*", WiFi.softAPIP());

		registerServerRoutes();

		server.begin(); // Start the web server

		webSocket.begin(); // Start the WebSocket server
		webSocket.onEvent([this](uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
			if(type == WStype_TEXT) { handleWebSocketMessage(payload, length); }
		});

		return true;
	}

	void AccessPoint::handleClients()
	{
		dnsServer.processNextRequest();
		server.handleClient();
		webSocket.loop();
	}

	void AccessPoint::sendWebSocketMessage(const String& message) {
		String mutableMessage = message; // create a non-const copy
		webSocket.broadcastTXT(mutableMessage);
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

	void AccessPoint::registerServerRoutes() {
		// Custom routes
		for(size_t i{0}; i < NUM_ROUTES; i++)
		{
			const auto& [endpoint, filePath, contentType, method, handler] = ROUTES[i];
			server.on(endpoint, static_cast<HTTPMethod>(method), [this, filePath, contentType, handler]() {
				if(handler)
				{
					handler(&server);
					return;
				}

				serveFile(filePath, contentType);
			});
		}

		// Fallback static file serving
		server.serveStatic("/", LittleFS, "/");

		// 404 handler
		server.onNotFound([this]() {
			server.send(404, "text/plain", "Not found - Palooka Network");
		});
	}

	void AccessPoint::serveFile(const char* filePath, const char* contentType)
	{
		File fileToServe = LittleFS.open(filePath, "r");
		if(!fileToServe || fileToServe.isDirectory())
		{
			if(fileToServe) { fileToServe.close(); }
			server.send(404, "text/plain", "File not found");
			return;
		}

		server.streamFile(fileToServe, contentType);
		fileToServe.close();
	}

	void AccessPoint::handleWebSocketMessage(uint8_t *payload, size_t length)
	{
		StaticJsonDocument<200> doc;
		DeserializationError error = deserializeJson(doc, payload, length);
		if(error)
		{
			Serial.print("JSON parse error: ");
			Serial.println(error.c_str());
			return;
		}

		CommandData cmdData = {0}; // Initialize the struct

		// Extract slider control data
		if(doc.containsKey("sliderName") && doc.containsKey("value"))
		{
			strlcpy(cmdData.sliderName, doc["sliderName"], sizeof(cmdData.sliderName));
			cmdData.value = doc["value"];
			cmdData.hasSlider = true;
		}
		// Extract joystick control data
		else if(doc.containsKey("x") && doc.containsKey("y"))
		{
			cmdData.x = doc["x"];
			cmdData.y = doc["y"];
			cmdData.hasJoystick = true;
		}
		// Extract flip command
		else if(doc.containsKey("flip") && doc["flip"])
		{
			cmdData.flip = true;
			cmdData.hasFlip = true;
		}

		// Enqueue the compact command data for processing by the robotControlTask.
		xQueueSend(Robot::RobotTaskManager::getInstance().getQueue(), &cmdData, portMAX_DELAY);
	}
}
