#include "FileSystem.h"
#include "AccessPoint.h"

PalookaNetwork::AccessPoint ap;

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
