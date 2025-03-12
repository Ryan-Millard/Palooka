#include "AccessPoint.h"

namespace PalookaNetwork
{
	// Public
	AccessPoint::AccessPoint(const Route* routes, const size_t num_routes,
			uint16_t webServerPort, uint16_t webSocketPort,
			const String& SSID_BASE)
		: ROUTES(routes), NUM_ROUTES(num_routes),
		server(webServerPort), webSocket(webSocketPort),
		SSID(generateSSID(SSID_BASE))
	{}

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

	void AccessPoint::registerServerRoutes() {
		// Register routes dynamically
		for(size_t i{0}; i < NUM_ROUTES; i++) {
			const Route& route{ROUTES[i]};

			server.on(route.endpoint, HTTP_GET, [this, route]() {
				serveFile(route.filePath, route.contentType);
			});
		}

		// Handle 404 errors
		server.onNotFound([this]() {
			server.send(404, "text/plain", "Not found - Palooka Network");
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

		// Individual wheel control data from the HTML slider
		if(doc.containsKey("motor") && doc.containsKey("value"))
		{
			const char* motor = doc["motor"];
			int value = doc["value"];
			Serial.print("Motor: ");
			Serial.print(motor);
			Serial.print(", Value: ");
			Serial.println(value);

			switch(motor[0])
			{
				case 'A':
				case 'a':
					robot.moveRightWheel(value);
					break;
				case 'B':
				case 'b':
					robot.moveLeftWheel(value);
					break;

				default:
					Serial.println("Unknown motor supplied.");
					break;
			}

			return;
		}

		// Dual wheel control from the HTML Joystick
		if(doc.containsKey("x") && doc.containsKey("y"))
		{
			float x = doc["x"];
			float y = doc["y"];
			Serial.print("Joystick X: ");
			Serial.print(x);
			Serial.print(", Y: ");
			Serial.println(y);
			robot.move(x, y);
			return;
		}

		// Error - none of the pre-defined JSON structures were matched
		Serial.println("Unknown JSON structure.");
	}
}
