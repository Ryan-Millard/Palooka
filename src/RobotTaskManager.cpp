#include "RobotTaskManager.h"

namespace Robot {
	bool RobotTaskManager::requestBatteryCalibration(TickType_t timeout) {
		uint32_t reply{0};
		TaskHandle_t caller = xTaskGetCurrentTaskHandle();
		if (!caller || !robotTaskHandle) return false;

		return (
				// =========================== RACE CONDITION ===========================
				// The line below uses a single task notification to send the caller handle.
				// If multiple tasks call this function at the same time, the second caller
				// may overwrite the notification, causing the first caller to potentially
				// time out. For this application, we accept this limitation since
				// battery calibration is low-priority and exact return value isn't critical.
				xTaskNotify(robotTaskHandle, (uint32_t)caller, eSetValueWithOverwrite)
				&&
				xTaskNotifyWait(0, 0, &reply, timeout) // Wait for reply from Robot task
				&&
				reply // Implicit cast to bool: 0 -> false, non-zero -> true
			   );
	}

	void RobotTaskManager::begin() {
		robot.begin();
	}

	void RobotTaskManager::RobotTask(void* pvParameters) {
		auto* self = static_cast<RobotTaskManager*>(pvParameters);
		self->robot.playStartupTone();
		self->robotTaskLoop();
	}

	void RobotTaskManager::startTask() {
		// Create a queue for robot commands (queue length of 10).
		websockQueue = xQueueCreate(10, sizeof(PalookaNetwork::CommandData));

		// Create the hardware control task pinned to core 1.
		xTaskCreatePinnedToCore(
			RobotTaskManager::RobotTask,
			"RobotTask",
			4096,			// Stack size
			this,			// Parameter
			2,				// Priority
			&robotTaskHandle,
			1				// Pin to core 1
		);
	}

	void RobotTaskManager::robotTaskLoop()
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

			// Calibration Request checks
			uint32_t callerHandle{0};
			if (xTaskNotifyWait(0, 0, &callerHandle, 0) == pdTRUE) {
				bool result{robot.calibrateBattery()};
				xTaskNotify((TaskHandle_t)callerHandle, result, eSetValueWithOverwrite);
			}

			// Minor yield for other tasks to execute
			vTaskDelay(pdMS_TO_TICKS(1));
		}
	}

	void RobotTaskManager::handleWebsocketCommands()
	{
		PalookaNetwork::CommandData cmdData;
		// Wait for a command with a 10ms timeout
		if(xQueueReceive(websockQueue, &cmdData, pdMS_TO_TICKS(10)) != pdPASS) { return; }

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

	void RobotTaskManager::handleRobotSliderCommand(const char robotLimb, const int value)
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

	void RobotTaskManager::sendBatteryUpdate()
	{
		int batteryLevel = robot.getBatteryPercentage();
		StaticJsonDocument<100> batteryDoc;
		batteryDoc["battery"] = batteryLevel;
		String batteryJson;
		serializeJson(batteryDoc, batteryJson);

		// Send the JSON string to all connected clients
		this->apManager.sendWebSocketMessage(batteryJson);
	}
}
