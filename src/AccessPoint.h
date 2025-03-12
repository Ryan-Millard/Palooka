#ifndef PALOOKANETWORK_ACCESSPOINT_H
#define PALOOKANETWORK_ACCESSPOINT_H

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include "FileSystem.h"
#include "FlipperBot.h"

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
					uint16_t webServerPort = 80, uint16_t webSocketPort = 81,
					const String& SSID_BASE = "Palooka_");

			bool begin();
			void handleWebSocketMessage(uint8_t *payload, size_t length);
			void handleClients();

		private:
			WebServer server;
			WebSocketsServer webSocket;
			PalookaBot::FlipperBot robot;

			const String generateSSID(const String& SSID_BASE);
			void registerServerRoutes();
			void serveFile(const char* filePath, const char* contentType);
	};
}

#endif
