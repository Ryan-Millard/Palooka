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
			FlipperBot(const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
					const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
					const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN);

			void move(const short x, const short y) const; // Both x and y must be between or equal to -1 or 1
			void moveLeftWheel(const short velocity) const;
			void moveRightWheel(const short velocity) const;
			void stopMoving() const;
	};
}

#endif
