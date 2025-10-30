#include "AccessPointManager.h"
#include "RobotTaskManager.h"
#include "system/ResetService.h"

PalookaNetwork::AccessPointManager& apManager{PalookaNetwork::AccessPointManager::getInstance()};
Robot::RobotTaskManager& robotManager{Robot::RobotTaskManager::getInstance(&apManager)};

void setup() {
	Serial.begin(115200);
	System::ResetService::begin();

	if (!apManager.begin()) {
		Serial.println("Palooka Access Point failed in setup()");
		return;
	}

	robotManager.begin();
	robotManager.startTask();
}

void loop() {
	apManager.handleClients();
}
