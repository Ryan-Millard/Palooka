#ifndef UTILS_NVSUTILS_H
#define UTILS_NVSUTILS_H

namespace System::Utils {
	// Clears the entire NVS partition (factory reset)
	void wipeNVSPartition();

	// Checks if NVS (Preferences) can be used safely
	bool isNVSAvailable();

	// Clears a single namespace
	void clearNamespace(const char* nsName);
}

#endif // UTILS_NVSUTILS_H
