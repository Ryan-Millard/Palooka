#include "FileSystem.h"

namespace FileSystem
{
	bool FSManager::begin(const bool FORMAT_ON_FAIL)
	{
		// Initialize LittleFS
		if(!LittleFS.begin(FORMAT_ON_FAIL)) {
			Serial.println("An Error has occurred while mounting LittleFS.");
			return false;
		}

		Serial.println("LittleFS mounted successfully.");
		return true;
	}

	File FSManager::getFile(const char* path)
	{
		Serial.println("Getting file: " + String(path));
		return LittleFS.open(path, "r");
	}
}
