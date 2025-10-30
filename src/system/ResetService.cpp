#include "system/ResetService.h"
#include "system/NVSUtils.h"
#include <Arduino.h>
#include <esp_task_wdt.h>  // optional if you want watchdog handling

namespace System {
	void ResetService::begin(int resetPin, unsigned long holdTimeMs, unsigned long maxMonitorTimeMs) {
		_resetPin = resetPin;
		_holdTimeMs = holdTimeMs;
		_maxMonitorTimeMs = maxMonitorTimeMs;

		pinMode(_resetPin, INPUT_PULLUP);

		xTaskCreate(
			ResetService::resetTask,
			"System::ResetService",
			2048,
			nullptr,
			1,
			nullptr
		);
	}

	// This function refers to IO5 as a button since shorting it logically works like pressing a button
	void ResetService::resetTask(void* pvParameters) {
		const TickType_t debounceDelay{50 / portTICK_PERIOD_MS};
		const unsigned long taskStart = millis();
		unsigned long pressStart = 0;
		bool buttonPreviouslyPressed = false;

		while ((millis() - taskStart) < _maxMonitorTimeMs) {
			const bool pinShorted = (digitalRead(_resetPin) == LOW);

			if (pinShorted) {
				if (!buttonPreviouslyPressed) {
					pressStart = millis();
					Serial.println("[ResetService] Button pressed. Hold to confirm reset...");
				} else if (millis() - pressStart >= _holdTimeMs) {
					Serial.println("[ResetService] Long press detected. Performing factory reset...");
					System::Utils::wipeNVSPartition();
					ESP.restart();
				}
			}

			buttonPreviouslyPressed = pinShorted;
			vTaskDelay(debounceDelay);
		}

		Serial.println("[ResetService] Monitoring window expired. Task ending.");
		vTaskDelete(nullptr);
	}

	int ResetService::_resetPin = -1;
	unsigned long ResetService::_holdTimeMs = 3000;
	unsigned long ResetService::_maxMonitorTimeMs = 10000;
}
