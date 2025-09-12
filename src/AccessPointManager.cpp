#include <Preferences.h>

#include <Preferences.h>
#include <ArduinoJson.h>

#include "AccessPointManager.h"
#include "RobotTaskManager.h"

namespace PalookaNetwork {
	namespace {
		bool isValidPassword(const char* password)
		{
			// Password must be at least 8 characters long
			if (strlen(password) < 8) return false;

			bool hasLower = false;
			bool hasUpper = false;
			bool hasNumber = false;
			bool hasSpecial = false;

			// Iterate through each character in the password
			for (size_t i = 0; i < strlen(password); ++i) {
				char c = password[i];

				// Check for lowercase letter
				if (c >= 'a' && c <= 'z') {
					hasLower = true;
				}
				// Check for uppercase letter
				else if (c >= 'A' && c <= 'Z') {
					hasUpper = true;
				}
				// Check for digit
				else if (c >= '0' && c <= '9') {
					hasNumber = true;
				}
				// Check for special character (non-alphanumeric)
				else {
					hasSpecial = true;
				}

				// If all conditions are met, no need to check further
				if (hasLower && hasUpper && hasNumber && hasSpecial) {
					return true;
				}
			}

			// Ensure all conditions are met
			return hasLower && hasUpper && hasNumber && hasSpecial;
		}

		void handleSetupPost(WebServer* server) {
			// Check for a raw body
			if (!server->hasArg("plain")) {
				server->send(400, "text/plain", "Bad Request: no data received");
				return;
			}

			// Get the raw JSON payload
			String payload = server->arg("plain");

			// Parse the JSON payload
			StaticJsonDocument<200> doc;
			DeserializationError error = deserializeJson(doc, payload);
			if(error) {
				server->send(400, "text/plain", "Invalid JSON");
				return;
			}

			// Extract data from the JSON document
			const char* name = doc["name"];
			const char* password = doc["password"];

			if(!name || !password) {
				const char* jsonResponse{
					R"delimiter(
					{
							"status": "Bad Request",
							"message": "Name and Password required"
					}
					)delimiter"
				};
				server->send(400, "application/json", jsonResponse);
				return;
			}

			// Backend Password Validation
			if(!isValidPassword(password)) {
				const char* jsonResponse{
					R"delimiter(
					{
							"status": "Bad Request",
							"message": "Invalid password"
					}
					)delimiter"
				};
				server->send(400, "application/json", jsonResponse);
				return;
			}

			Serial.println("Received POST data:");
			Serial.print("Name: ");
			Serial.println(name);
			Serial.print("Password: ");
			Serial.println(password);

			Preferences preferences;
			// Initialize preferences with the namespace "MyApp"
			preferences.begin("Palooka", false);  // Read-write mode

			// Save the user's input
			preferences.putString("AP_Name", name);
			preferences.putString("AP_Password", password);

			preferences.end(); // Close the preferences

			const char* jsonResponse{
				R"delimiter(
				{
						"status": "ok"
				}
				)delimiter"
			};
			server->send(200, "application/json", jsonResponse);
		}

		void handleRestart(WebServer* server) {
			server->send(200, "application/json", "{\"status\":\"ok\"}");
			delay(1000); // Ensure there is enough time to send & read response in browser
			ESP.restart();
		}

		void handleCalibrateBattery(WebServer* server) {
			const char* success = Robot::RobotTaskManager::getInstance().requestBatteryCalibration() ? "true" : "false";
			const char responseTemplate[] = "{\"success\": %s}";
			size_t responseSize = sizeof(responseTemplate) + strlen(success);

			char response[responseSize];
			snprintf(response, responseSize, responseTemplate, success);
			server->send(200, "application/json", response);
		}

		void handleFactoryReset(WebServer* server) {
			// Clear all saved preferences
			Preferences preferences;
			preferences.begin("Palooka", false);  // Open in read-write mode
			preferences.clear();				  // Erase all keys in this namespace
			preferences.end();					// Close preferences

			const char* jsonResponse{
				R"delimiter(
				{
						"status": "ok",
						"message": "Factory reset complete. You will need to reconnect to our device."
				}
				)delimiter"
			};
			server->send(200, "application/json", jsonResponse);

			delay(1000); // Give the response time to send
			ESP.restart(); // Restart the device
		}
	}

	const Route AccessPointManager::AP_ROUTES[]{
		{"/", "/index.html", "text/html"},
			{"/controller", "/controller.html", "text/html"},
			{"/setup", "/setup.html", "text/html"},
			{"/setup", "/setup.html", "text/html", HttpMethod::POST, handleSetupPost},
			{"/restart", "/setup.html", "text/html", HttpMethod::POST, handleRestart},
			{"/calibrateBattery", "/setup.html", "text/html", HttpMethod::GET, handleCalibrateBattery},
			{"/factoryReset", "/setup.html", "application/json", HttpMethod::POST, handleFactoryReset},
	};
	const size_t AccessPointManager::AP_ROUTES_COUNT{sizeof(AP_ROUTES) / sizeof(AP_ROUTES[0])};

	bool AccessPointManager::begin() { return ap.begin(); }

	void AccessPointManager::handleClients() { ap.handleClients(); }

	void AccessPointManager::sendWebSocketMessage(const String& message) { ap.sendWebSocketMessage(message); }
}
