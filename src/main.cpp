#include <ArduinoJson.h>
#include <Preferences.h>

#include <PalookaBot/FlipperBot.h>
#include "AccessPoint.h"

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

// Access Point, web server & web socket server
const PalookaNetwork::Route AP_ROUTES[]{
	/* Home Page */ {"/", "/index.html", "text/html"},
	/* Controller Page */ {"/controller", "/controller.html", "text/html"},
	/* Setup Page */ {"/setup", "/setup.html", "text/html"},
	/* Setup Page */ {"/setup", "/setup.html", "text/html", PalookaNetwork::HttpMethod::POST, [](WebServer* server){
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
	}},
	/* Restart Device */ {"/restart", "/setup.html", "text/html", PalookaNetwork::HttpMethod::POST, [](WebServer* server){
		server->send(200, "application/json", "{\"status\":\"ok\"}");
		delay(1000); // Ensure there is enough time to send & read response in browser
		ESP.restart();
	}},
	/* Calibrate Battery */ {"/calibrateBattery", "/setup.html", "text/html", PalookaNetwork::HttpMethod::GET, [](WebServer* server){
		server->send(200, "text/plain", "Calibrating battery...");
	}},
	/* Factory Reset */ {"/factoryReset", "/setup.html", "application/json", PalookaNetwork::HttpMethod::POST, [](WebServer* server){
		// Clear all saved preferences
		Preferences preferences;
		preferences.begin("Palooka", false);  // Open in read-write mode
		preferences.clear();                  // Erase all keys in this namespace
		preferences.end();                    // Close preferences

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
	}},
};
PalookaNetwork::AccessPoint ap(AP_ROUTES, sizeof(AP_ROUTES)/sizeof(AP_ROUTES[0]));

PalookaBot::FlipperBot& robot = PalookaBot::FlipperBot::getInstance();
QueueHandle_t robotQueue;

void handleRobotSliderCommand(const char robotLimb, const int value)
{
	switch(robotLimb)
	{
		case 'R': case 'r': // Right motor
			robot.moveRightWheel(value);
			break;
		case 'L': case 'l': // Left motor
			robot.moveLeftWheel(value);
			break;
		case 'F': case 'f': // Flipper arm
			robot.moveFlipper(value);
			break;
		default:
			Serial.println("Unknown robot limb JSON supplied.");
			break;
	}
}

void handleWebsocketCommands()
{
	PalookaNetwork::CommandData cmdData;
	// Wait for a command with a 10ms timeout
	if(xQueueReceive(robotQueue, &cmdData, pdMS_TO_TICKS(10)) != pdPASS) { return; }

	// Process slider control data
	if(cmdData.hasSlider)
	{
		char robotLimb = cmdData.sliderName[0];
		Serial.print("Limb: ");
		Serial.print(robotLimb);
		Serial.print(", Value: ");
		Serial.println(cmdData.value);

		handleRobotSliderCommand(robotLimb, cmdData.value);
	}
	// Process joystick control data
	else if(cmdData.hasJoystick)
	{
		Serial.print("Joystick X: ");
		Serial.print(cmdData.x);
		Serial.print(", Y: ");
		Serial.println(cmdData.y);

		robot.move(cmdData.x, cmdData.y);
	}
	// Process flip command
	else if(cmdData.hasFlip)
	{
		robot.flip();
	}
	else
	{
		Serial.println("Unknown command structure.");
	}
}

void sendBatteryUpdate()
{
	int batteryLevel = robot.getBatteryPercentage();
	StaticJsonDocument<100> batteryDoc;
	batteryDoc["battery"] = batteryLevel;
	String batteryJson;
	serializeJson(batteryDoc, batteryJson);

	// Send the JSON string to all connected clients
	ap.sendWebSocketMessage(batteryJson);
}

void robotTaskLoop()
{
	static const unsigned long batteryUpdateInterval = 5000; // 5 seconds
	static unsigned long lastBatteryUpdate = 0; // Last battery update time
	static const unsigned long ledToggleInterval = 1000; // 1 second
	static unsigned long lastLedToggle = 0; // Last time LED was toggled
	while(true)
	{
		unsigned long currentMillis = millis();
		if((currentMillis - lastBatteryUpdate) >= batteryUpdateInterval)
		{
			sendBatteryUpdate();
			lastBatteryUpdate = currentMillis;
		}
		if((currentMillis - lastLedToggle) >= ledToggleInterval)
		{
			robot.toggleLed();
			lastLedToggle = currentMillis;
		}

		handleWebsocketCommands(); // Non-blocking

		// Minor yield for other tasks to execute
		vTaskDelay(pdMS_TO_TICKS(1));
	}
}

void robotControlTask(void* pvParameters)
{
	robot.playStartupTone();

	robotTaskLoop();
}

void setup() {
	Serial.begin(115200);

	if (!ap.begin()) {
		Serial.println("Palooka Access Point failed in setup()");
		return;
	}

	robot.begin();
	// Create a queue for robot commands (queue length of 10).
	robotQueue = xQueueCreate(10, sizeof(PalookaNetwork::CommandData));

	// Create the hardware control task pinned to core 1.
	xTaskCreatePinnedToCore(
		robotControlTask, // Task function
		"RobotTask",      // Task name
		4096,             // Stack size
		NULL,             // Parameter
		2,                // Priority
		NULL,             // Task handle
		1                 // Pin to core 1
	);
}

void loop() {
	ap.handleClients();
}
