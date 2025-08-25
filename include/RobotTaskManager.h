#ifndef ROBOT_TASK_MANAGER_H
#define ROBOT_TASK_MANAGER_H

#include <ArduinoJson.h>
#include <stdexcept>

#include <PalookaBot/FlipperBot.h>
#include "AccessPointManager.h"

namespace Robot {
	class RobotTaskManager {
		public:
			static RobotTaskManager& getInstance(PalookaNetwork::AccessPointManager* manager = nullptr) {
				static RobotTaskManager* instance = nullptr;
				if (instance) { return *instance; }

				// Guard against null-init
				if (!manager) {
					throw std::runtime_error("Error: RobotTaskManager must be initialized first! You must provide an AccessPointManager");
				}

				// Init & return
				instance = new RobotTaskManager(*manager);
				return *instance;
			}
			QueueHandle_t& getQueue() { return robotQueue; }

			void begin();
			void startTask();
		private:
			PalookaBot::FlipperBot& robot;
			PalookaNetwork::AccessPointManager& apManager;
			QueueHandle_t robotQueue;

			static void RobotTask(void* pvParameters);
			void robotTaskLoop();
			void handleWebsocketCommands();
			void handleRobotSliderCommand(char limb, int value);
			void sendBatteryUpdate();

			RobotTaskManager(PalookaNetwork::AccessPointManager& manager)
				: robot(PalookaBot::FlipperBot::getInstance()), apManager(manager) {}

			RobotTaskManager(const RobotTaskManager&) = delete;
			RobotTaskManager& operator=(const RobotTaskManager&) = delete;
	};
}

#endif // ROBOT_TASK_MANAGER_H
