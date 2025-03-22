#ifndef PALOOKANETWORK_ACCESSPOINT_H
#define PALOOKANETWORK_ACCESSPOINT_H

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <DNSServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include <FileSystem/FileSystem.h>

extern QueueHandle_t robotQueue;

namespace PalookaNetwork
{
	struct Route
	{
		const char* endpoint; // Server endpoint (URL)
		const char* filePath; // File system path
		const char* contentType; // Proper MIME type
	};

	class AccessPoint
	{
		public:
			const String SSID;
			const Route* ROUTES;  // Pointer to routes array
			const size_t NUM_ROUTES;  // Number of routes

			AccessPoint(const Route* routes, const size_t num_routes,
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
