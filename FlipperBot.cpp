#include "FlipperBot.h"

namespace PalookaBot
{
	// Public
	FlipperBot::FlipperBot(const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
			const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
			const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN)
		: wheelRight(RIGHT_PWM_PIN, RIGHT_DIRECTION_PIN, EN8V_PIN, EN5V_PIN, DVR_SLEEP_PIN),
		// Invert left wheel to allow it to travel in the same direction as the right wheel
		wheelLeft(LEFT_PWM_PIN, LEFT_DIRECTION_PIN, EN8V_PIN, EN5V_PIN, DVR_SLEEP_PIN, true /* Inverted */)
	{
	}

	// Expects that x and y are either equal to or between -1 and 1
	void FlipperBot::move(const float x, const float y) const
	{
		float left = y + x;
		float right = y - x;

		// Normalize to keep within [-1, 1] range
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
