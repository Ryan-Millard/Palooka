#ifndef PALOOKANETWORK_ACCESSPOINT_H
#define PALOOKANETWORK_ACCESSPOINT_H

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <LittleFS.h>

#include "FileSystem.h"

namespace PalookaNetwork
{
	class AccessPoint
	{
		public:
			const String SSID;

			AccessPoint(uint16_t webServerPort = 80, uint16_t webSocketPort = 81, const String& SSID_BASE = "Palooka_")
				: server(webServerPort), webSocket(webSocketPort), SSID(generateSSID(SSID_BASE)) {}

			bool begin();
			void handleClients();

		private:
			WebServer server;
			WebSocketsServer webSocket;

			const String generateSSID(const String& SSID_BASE);
			void serverSetup();
			void serveFile(const char* filePath, const char* contentType);
	};
}

#endif
