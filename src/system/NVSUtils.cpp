#include "system/NVSUtils.h"
#include <nvs_flash.h>
#include <Preferences.h>

namespace System::Utils {
	void wipeNVSPartition() {
		Serial.println("[NVS] Erasing entire NVS partition...");

		esp_err_t err = nvs_flash_erase();
		if (err != ESP_OK) {
			Serial.printf("[NVS] Failed to erase NVS: %s\n", esp_err_to_name(err));
			return;
		}

		err = nvs_flash_init();
		int maxRetries = 3; // Prevents infinite loop
		// Ensure it is truly usable
		while (maxRetries-- && (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND)) {
			nvs_flash_erase();
			err = nvs_flash_init();
		}

		if (err == ESP_OK) {
			Serial.println("[NVS] NVS successfully erased and reinitialized.");
			return;
		}

		Serial.printf("[NVS] Failed to reinitialize NVS: %s\n", esp_err_to_name(err));
	}

	bool isNVSAvailable() {
		esp_err_t err = nvs_flash_init();
		return (err == ESP_OK || err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND);
	}

	void clearNamespace(const char* nsName) {
		Serial.printf("[NVS] Clearing namespace: '%s'\n", nsName);

		Preferences prefs;
		if (!prefs.begin(nsName, false)) {
			Serial.printf("[NVS] Failed to open namespace '%s'\n", nsName);
			return;
		}

		prefs.clear();
		prefs.end();
		Serial.printf("[NVS] Namespace '%s' cleared.\n", nsName);
	}
}
