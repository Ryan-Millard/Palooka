#include "FileSystem.h"
#include "AccessPoint.h"

const PalookaNetwork::Route AP_ROUTES[]{
	{"/", "/index.html", "text/html"},
	{"/styles/index.css", "/styles/index.css", "text/css"},
	{"/controller", "/controller.html", "text/html"},
	{"/styles/controller.css", "/styles/controller.css", "text/css"},
	{"/scripts/controller.js", "/scripts/controller.js", "text/javascript"}, // <- Added comma here
	{"/scripts/fullscreen.js", "/scripts/fullscreen.js", "text/javascript"},
	{"/setup", "/setup.html", "text/html"},
	{"/styles/setup.css", "/styles/setup.css", "text/css"}
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
