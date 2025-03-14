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
	/* Setup Page */ {"/setup", "/setup.html", "text/html"},
	/* Setup Styles */ {"/styles/setup.css", "/styles/setup.css", "text/css"}
};
PalookaNetwork::AccessPoint ap(AP_ROUTES, sizeof(AP_ROUTES)/sizeof(AP_ROUTES[0]));

PalookaBot::FlipperBot robot;
QueueHandle_t robotQueue;

void robotControlTask(void* pvParameters) {
	// Create a robot instance and a JSON document to hold incoming commands.
	StaticJsonDocument<200> jsonCmd;

	while(true) {
		// Block until a new JSON command is received from the queue.
		if (xQueueReceive(robotQueue, &jsonCmd, portMAX_DELAY) == pdPASS) {
			// Process slider control JSON.
			if (jsonCmd.containsKey("sliderName") && jsonCmd.containsKey("value")) {
				const char* robotLimb = jsonCmd["sliderName"];
				int value = jsonCmd["value"];
				Serial.print("Limb: ");
				Serial.print(robotLimb);
				Serial.print(", Value: ");
				Serial.println(value);

				switch(robotLimb[0]) {
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
			// Process joystick control JSON.
			else if (jsonCmd.containsKey("x") && jsonCmd.containsKey("y")) {
				float x = jsonCmd["x"];
				float y = jsonCmd["y"];
				Serial.print("Joystick X: ");
				Serial.print(x);
				Serial.print(", Y: ");
				Serial.println(y);
				robot.move(x, y);
			}
			else {
				Serial.println("Unknown JSON structure.");
			}
			// Clear the document for the next command.
			jsonCmd.clear();
		}
	}
}

void setup() {
	Serial.begin(115200);

	if (!ap.begin()) {
		Serial.println("Palooka Access Point failed in setup()");
		return;
	}

	robot.begin();
	robot.playStartupTone();
	// Create a queue for robot commands (queue length of 10).
	robotQueue = xQueueCreate(10, sizeof(StaticJsonDocument<200>));

	// Create the hardware control task pinned to core 1.
	xTaskCreatePinnedToCore(
		robotControlTask, // Task function
		"RobotTask",      // Task name
		2048,             // Stack size
		NULL,             // Parameter
		2,                // Priority
		NULL,             // Task handle
		1                 // Pin to core 1
	);
}

void loop() {
	ap.handleClients();
}
