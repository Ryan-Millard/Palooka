#include "FlipperBot.h"

namespace PalookaBot
{
	// ========== Private ==========

	// ========== Public ==========
	// Default parameters are recommended for the use of this constructor.
	FlipperBot::FlipperBot(const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
			const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
			const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN)
		: wheelRight(RIGHT_PWM_PIN, RIGHT_DIRECTION_PIN),
		wheelLeft(LEFT_PWM_PIN, LEFT_DIRECTION_PIN, true /* Inverted */) // Invert left wheel so it travels in the
																		 // same direction as right wheel.
	{
		// ========== Power up robot ==========
		// Initialize pins
		pinMode(EN8V_PIN, OUTPUT);
		pinMode(EN5V_PIN, OUTPUT);
		pinMode(DVR_SLEEP_PIN, OUTPUT);
		// Enable power and wake up drivers
		digitalWrite(EN8V_PIN, HIGH);
		digitalWrite(EN5V_PIN, HIGH);
		digitalWrite(DVR_SLEEP_PIN, HIGH);

	}

	// Expects that x and y are either equal to or between -1 and 1.
	void FlipperBot::move(const float x, const float y) const
	{
		float left = y + x;
		float right = y - x;

		// Normalize to keep within [-1, 1] range.
		float maxVal = std::max(std::abs(left), std::abs(right));
		if (maxVal > 1.0f) {
			left /= maxVal;
			right /= maxVal;
		}

		int leftVelocity = left * 255;
		int rightVelocity = right * 255;
		Serial.print("leftVelocity: "); Serial.println(leftVelocity);
		Serial.print("rightVelocity: "); Serial.println(rightVelocity);

		wheelLeft.rotate(leftVelocity);
		wheelRight.rotate(rightVelocity);
	}
	void FlipperBot::moveLeftWheel(const short velocity) const
	{
		wheelLeft.rotate(velocity);
	}
	void FlipperBot::moveRightWheel(const short velocity) const
	{
		wheelRight.rotate(velocity);
	}

	void FlipperBot::stopMoving() const
	{
		wheelLeft.stop();
		wheelRight.stop();
	}
}
