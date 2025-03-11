#include "FlipperBot.h"

namespace PalookaBot
{
	// Public
	FlipperBot::FlipperBot(const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
			const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
			const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN)
		: wheelLeft(LEFT_PWM_PIN, LEFT_DIRECTION_PIN, EN8V_PIN, EN5V_PIN, DVR_SLEEP_PIN),
		// Invert right wheel to allow it to travel in the same direction as the left wheen
		wheelRight(RIGHT_PWM_PIN, RIGHT_DIRECTION_PIN, EN8V_PIN, EN5V_PIN, DVR_SLEEP_PIN, true /* Inverted */)
	{
	}

	void FlipperBot::move(const short x, const short y) const
	{
		// Calculate motor speeds for differential drive
		int leftVelocity = (y + x) * 255;
		int rightVelocity = (y - x) * 255;

		// Apply speeds to motors
		// No need to constrain the values as rotate does it internally
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
