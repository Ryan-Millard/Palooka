#ifndef SYSTEM_RESETSERVICE_H
#define SYSTEM_RESETSERVICE_H

#include <Arduino.h>

namespace System {
	class ResetService {
		public:
			// Initialize the service: starts background monitoring
			static void begin(int resetPin = 5, unsigned long holdTimeMs = 3000UL, unsigned long _maxMonitorTimeMs = 10000UL);

		private:
			static void resetTask(void* pvParameters);

			static int _resetPin;
			static unsigned long _holdTimeMs;
			static unsigned long _maxMonitorTimeMs;
	};
}

#endif // SYSTEM_RESETSERVICE_H
