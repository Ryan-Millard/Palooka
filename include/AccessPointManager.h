#ifndef ACCESS_POINT_MANAGER_H
#define ACCESS_POINT_MANAGER_H

#include "AccessPoint.h"

namespace PalookaNetwork {
	class AccessPointManager {
		public:
			static AccessPointManager& getInstance() {
				static AccessPointManager instance; // guaranteed single instance
				return instance;
			}

			bool begin();
			void handleClients();
			void sendWebSocketMessage(const String& message);

		private:
			static const Route AP_ROUTES[];
			static const size_t AP_ROUTES_COUNT;

			AccessPoint ap;

			AccessPointManager() : ap(AP_ROUTES, AP_ROUTES_COUNT) {}

			AccessPointManager(const AccessPointManager&) = delete;
			AccessPointManager& operator=(const AccessPointManager&) = delete;
	};
}

#endif // ACCESS_POINT_MANAGER_H
