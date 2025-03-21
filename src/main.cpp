#include <ArduinoJson.h>
#include <PalookaBot/FlipperBot.h>
#include <FileSystem/FileSystem.h>
#include "AccessPoint.h"

// Access Point, web server & web socket server
const PalookaNetwork::Route AP_ROUTES[]{
	/* Home Page */ {"/", "/index.html", "text/html"},
	/* Base Styles */ {"/styles/index.css", "/styles/index.css", "text/css"},
	/* Controller Page */ {"/controller", "/controller.html", "text/html"},
	/* Controller Styles */ {"/styles/controller.css", "/styles/controller.css", "text/css"},
	/* Controller JS */ {"/scripts/controller.js", "/scripts/controller.js", "text/javascript"},
	/* Fullscreen JS */ {"/scripts/fullscreen.js", "/scripts/fullscreen.js", "text/javascript"},
	/* Web Sockets manager JS */ {"/scripts/websocket.js", "/scripts/websocket.js", "text/javascript"},
	/* Controller Web Sockets JS */ {"/scripts/controller_web_socket.js", "/scripts/controller_web_socket.js", "text/javascript"},
	/* Battery Web Sockets JS */ {"/scripts/battery_web_socket.js", "/scripts/battery_web_socket.js", "text/javascript"},
	/* Choose Joystick/Slider JS */ {"/scripts/switch_control_type.js", "/scripts/switch_control_type.js", "text/javascript"},
	/* Setup Page */ {"/setup", "/setup.html", "text/html"},
	/* Setup Styles */ {"/styles/setup.css", "/styles/setup.css", "text/css"},
	/* Star image */ {"/img/star.svg", "/img/star.svg", "image/svg+xml"},
	/* Pencil image */ {"/img/pencil.svg", "/img/pencil.svg", "image/svg+xml"}
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
	StaticJsonDocument<200> jsonCmd;
	// Wait for a JSON command (as String) from the queue.
	if(xQueueReceive(robotQueue, &jsonCmd, portMAX_DELAY) != pdPASS) { return; }

	// Process slider control JSON.
	if(jsonCmd.containsKey("sliderName") && jsonCmd.containsKey("value"))
	{
		const char* sliderName = jsonCmd["sliderName"];
		const char robotLimb = sliderName[0];
		int value = jsonCmd["value"];
		Serial.print("Limb: ");
		Serial.print(robotLimb);
		Serial.print(", Value: ");
		Serial.println(value);

		handleRobotSliderCommand(robotLimb, value);
	}
	// Process joystick control JSON.
	else if(jsonCmd.containsKey("x") && jsonCmd.containsKey("y"))
	{
		float x = jsonCmd["x"];
		float y = jsonCmd["y"];
		Serial.print("Joystick X: ");
		Serial.print(x);
		Serial.print(", Y: ");
		Serial.println(y);

		robot.move(x, y);
	}
	else if(jsonCmd.containsKey("flip") && jsonCmd["flip"])
	{
		robot.flip();
	}
	else
	{
		Serial.println("Unknown JSON structure.");
	}

	// Clear the document for the next command.
	jsonCmd.clear();
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

void handleWebSockets()
{
	static const unsigned long updateInterval = 5000; // 5 seconds
	static unsigned long lastBatteryUpdate = 0; // Last battery update time
	while(true)
	{
		unsigned long currentMillis = millis();
		// Calculate the time elapsed since the last update, accounting for overflow
		unsigned long elapsedTime = currentMillis - lastBatteryUpdate;
		if (elapsedTime >= updateInterval)
		{
			sendBatteryUpdate();
			Serial.println("Sending battery update...");
			lastBatteryUpdate = currentMillis;
		}

		handleWebsocketCommands();
	}
}

void robotControlTask(void* pvParameters)
{
	robot.playStartupTone();

	handleWebSockets();
}

void setup() {
	Serial.begin(115200);

	if (!ap.begin()) {
		Serial.println("Palooka Access Point failed in setup()");
		return;
	}

	robot.begin();
	// Create a queue for robot commands (queue length of 10).
	robotQueue = xQueueCreate(10, sizeof(StaticJsonDocument<200>));

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
