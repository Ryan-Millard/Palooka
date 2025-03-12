#include <FileSystem/FileSystem.h>
#include "AccessPoint.h"

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

void setup() {
	Serial.begin(115200);

	// Initialize LittleFS
	if(!ap.begin()) {
		Serial.println("Palooka Access Point failed in setup()");
		return;
	}
}

void loop() {
	ap.handleClients();
}
