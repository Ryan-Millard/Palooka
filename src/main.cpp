#include "AccessPointManager.h"
#include "RobotTaskManager.h"

PalookaNetwork::AccessPointManager& apManager{PalookaNetwork::AccessPointManager::getInstance()};
Robot::RobotTaskManager& robotManager{Robot::RobotTaskManager::getInstance(&apManager)};

void setup() {
	Serial.begin(115200);

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
