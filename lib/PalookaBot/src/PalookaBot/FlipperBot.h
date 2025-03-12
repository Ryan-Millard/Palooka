#ifndef PALOOKABOT_FLIPPERBOT_H
#define PALOOKABOT_FLIPPERBOT_H

#include <Arduino.h>
#include "Motor.h"

namespace PalookaBot
{
	// A battlebot with 2 wheels (motors) and one arm (servo)
	// Based on Mootbotv1_241122
	class FlipperBot
	{
		private:
			// ========== Wheels ==========
			const Motor wheelLeft; // Motor B
			const Motor wheelRight; // Motor A

		public:
			// Default parameters (based on the Mootbotv1_241122) are recommended for the use of this constructor
			// Since the hardware will likely remain the same
			FlipperBot(const byte LEFT_PWM_PIN = 25, const byte LEFT_DIRECTION_PIN = 26,
					const byte RIGHT_PWM_PIN = 32, const byte RIGHT_DIRECTION_PIN = 33,
					const byte EN8V_PIN = 16, const byte EN5V_PIN = 17, const byte DVR_SLEEP_PIN = 12);

			// ========== Movement functions ==========
			// Move the robot in any direction using x and y values.
			// Both x and y are expected to be between -1 and 1, if not they are normalised to suit expectations.
			void move(const float x, const float y) const;
			// Move the robot's left or right wheel in a certain direction.
			// Both are sibling functions that expect values between -255 and 255.
			// Note that turning with these functions achieves a turn in the opposite direction,
			// moveLeftWheel turns the robot right and moveRightWheel turns it left
			void moveLeftWheel(const short velocity) const; // Sibling of moveRightWheel
			void moveRightWheel(const short velocity) const; // Sibling of moveLeftWheel
			// Completely halts the motion of the robot
			void stopMoving() const;
	};
}

#endif
