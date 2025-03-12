#ifndef PALOOKABOT_FLIPPERBOT_H
#define PALOOKABOT_FLIPPERBOT_H

#include <Arduino.h>
#include "Motor.h"

namespace PalookaBot
{
	class FlipperBot
	{
		private:
			const Motor wheelLeft;
			const Motor wheelRight;

		public:
			FlipperBot(const byte LEFT_PWM_PIN = 25, const byte LEFT_DIRECTION_PIN = 26,
					const byte RIGHT_PWM_PIN = 32, const byte RIGHT_DIRECTION_PIN = 33,
					const byte EN8V_PIN = 16, const byte EN5V_PIN = 17, const byte DVR_SLEEP_PIN = 12);

			void move(const float x, const float y) const;
			void moveLeftWheel(const short velocity) const;
			void moveRightWheel(const short velocity) const;
			void stopMoving() const;
	};
}

#endif
