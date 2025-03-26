#ifndef PALOOKANETWORK_ACCESSPOINT_H
#define PALOOKANETWORK_ACCESSPOINT_H

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <DNSServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

extern QueueHandle_t robotQueue;

namespace PalookaNetwork
{
	struct Route
	{
		const char* endpoint; // Server endpoint (URL)
		const char* filePath; // File system path
		const char* contentType; // Proper MIME type
	};

	struct CommandData {
		char sliderName[16];
		int value;
		float x, y;
		bool flip;
		bool hasSlider;
		bool hasJoystick;
		bool hasFlip;
	};

	class AccessPoint
	{
		public:
			const String SSID;
			const Route* ROUTES;
			const size_t NUM_ROUTES;

			AccessPoint(const Route* routes = nullptr, const size_t num_routes = 0,
					const uint16_t webServerPort = 80, const uint16_t webSocketPort = 81,
					const uint16_t dnsServerPort = 53,
					const String& SSID_BASE = "Palooka_");

			bool begin();
			void handleWebSocketMessage(uint8_t *payload, size_t length);
			void handleClients();
			void sendWebSocketMessage(const String& message);

		private:
			WebServer server;
			WebSocketsServer webSocket;
			DNSServer dnsServer;
			uint16_t DNS_SERVER_PORT;

			const String generateSSID(const String& SSID_BASE);
			void registerServerRoutes();
			void serveFile(const char* filePath, const char* contentType);
	};
}

#endif
