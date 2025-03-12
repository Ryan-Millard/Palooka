#include "FlipperBot.h"

namespace PalookaBot
{
	// ========== Private ==========
	// No additional private members or helper functions are declared here.

	// ========== Public ==========
	// The constructor sets up the wheels and powers up the robot by enabling the necessary voltage rails.
	FlipperBot::FlipperBot(const byte FLIPPER_PIN,
			const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
			const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
			const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN)
		: FLIPPER_MAX_ANGLE(180), FLIPPER_MIN_ANGLE(0),
		wheelRight(RIGHT_PWM_PIN, RIGHT_DIRECTION_PIN), // Initialize the right wheel with its designated pins.
		wheelLeft(LEFT_PWM_PIN, LEFT_DIRECTION_PIN, true /* Inverted */) // Invert the left wheel so that both wheels drive in the same forward direction.
	{
		// ========== Power up robot ==========
		// Configure the power and sleep control pins as outputs.
		pinMode(EN8V_PIN, OUTPUT); // Set the pin controlling the 8V rail as an output.
		pinMode(EN5V_PIN, OUTPUT); // Set the pin controlling the 5V rail as an output.
		pinMode(DVR_SLEEP_PIN, OUTPUT); // Set the DVR sleep pin as an output.

		// Activate the power rails and wake the motor driver.
		digitalWrite(EN8V_PIN, HIGH); // Enable power on the 8V rail.
		digitalWrite(EN5V_PIN, HIGH); // Enable power on the 5V rail.
		digitalWrite(DVR_SLEEP_PIN, HIGH); // Wake the motor driver from sleep.

		// ========== Initialize flipper ==========
		flipper.setPeriodHertz(50);
		flipper.attach(FLIPPER_PIN, 500, 2500);
		flipper.write(90);
	}

	void FlipperBot::moveFlipper(byte angle)
	{
		// Ensure the angle is within the angle limits
		angle = constrain(angle, FLIPPER_MIN_ANGLE, FLIPPER_MAX_ANGLE);
		flipper.write(angle); // Set the flipper to the angle
	}

	void FlipperBot::flip()
	{
		moveFlipper(FLIPPER_MIN_ANGLE); // Put flipper against the ground
		moveFlipper(FLIPPER_MAX_ANGLE); // Quickly lift flipper
		moveFlipper(FLIPPER_MIN_ANGLE); // Put flipper against the ground
	}

	// The move() function takes x (turn) and y (forward/backward) inputs, each expected to be in the range [-1, 1].
	// It calculates individual wheel speeds using differential drive logic.
	void FlipperBot::move(const float x, const float y) const
	{
		// Compute preliminary speed values for each wheel.
		float left = y + x;
		float right = y - x;

		// Normalize the values if either exceeds the [-1, 1] range.
		float maxVal = std::max(std::abs(left), std::abs(right));
		if (maxVal > 1.0f) {
			left /= maxVal;
			right /= maxVal;
		}

		// Convert normalized values to a PWM scale from 0 to 255.
		int leftVelocity = left * 255;
		int rightVelocity = right * 255;

		// Issue commands to rotate the wheels at the computed speeds.
		wheelLeft.rotate(leftVelocity);
		wheelRight.rotate(rightVelocity);
	}
	// Directly commands the left wheel with a specified velocity (-255 to 255).
	void FlipperBot::moveLeftWheel(const short velocity) const
	{
		wheelLeft.rotate(velocity);
	}
	// Directly commands the right wheel with a specified velocity (-255 to 255).
	void FlipperBot::moveRightWheel(const short velocity) const
	{
		wheelRight.rotate(velocity);
	}
	// Stops both wheels, thereby halting all robot movement.
	void FlipperBot::stopMoving() const
	{
		wheelLeft.stop();
		wheelRight.stop();
	}
}
