#include "FlipperBot.h"
#include <algorithm> // For std::max and std::abs

namespace PalookaBot
{
	// ========== Public ==========
	// The constructor sets up the wheels and powers up the robot by enabling the necessary voltage rails.
	FlipperBot::FlipperBot(const byte FLIPPER_PIN,
			const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
			const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
			const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN)
		: EN8V_PIN(EN8V_PIN), EN5V_PIN(EN5V_PIN), DVR_SLEEP_PIN(DVR_SLEEP_PIN),
		FLIPPER_PIN(FLIPPER_PIN),
		FLIPPER_MAX_ANGLE(180), FLIPPER_MIN_ANGLE(0),
		wheelRight(RIGHT_PWM_PIN, RIGHT_DIRECTION_PIN), 
		wheelLeft(LEFT_PWM_PIN, LEFT_DIRECTION_PIN, true /* Inverted */)
	{
		// No initialization in constructor body - all done in begin()
	}

	void FlipperBot::begin()
	{
		// ========== Allocate timers for servo ==========
		ESP32PWM::allocateTimer(0);
		ESP32PWM::allocateTimer(1);
		ESP32PWM::allocateTimer(2);
		ESP32PWM::allocateTimer(3);

		// ========== Power up robot ==========
		// Configure the power and sleep control pins as outputs.
		pinMode(EN8V_PIN, OUTPUT);
		pinMode(EN5V_PIN, OUTPUT);
		pinMode(DVR_SLEEP_PIN, OUTPUT);

		// Activate the power rails and wake the motor driver.
		digitalWrite(EN8V_PIN, HIGH);
		digitalWrite(EN5V_PIN, HIGH);
		digitalWrite(DVR_SLEEP_PIN, HIGH);

		// ========== Initialize flipper ==========
		flipper.setPeriodHertz(50);

		// Using a broader pulse width range for better compatibility
		// with a variety of servos (500-2500 μs)
		flipper.attach(FLIPPER_PIN, 500, 2500);
	}

	void FlipperBot::moveFlipper(byte angle)
	{
		// Ensure the angle is within the angle limits
		angle = constrain(angle, FLIPPER_MIN_ANGLE, FLIPPER_MAX_ANGLE);
		flipper.write(angle); // Set the flipper to the angle
	}

	void FlipperBot::flip()
	{
		// Add delays to make the flipping action more effective
		moveFlipper(FLIPPER_MIN_ANGLE); // Put flipper against the ground
		delay(300);                     // Wait for servo to reach position
		moveFlipper(FLIPPER_MAX_ANGLE); // Quickly lift flipper
		delay(300);                     // Wait for servo to reach position
		moveFlipper(FLIPPER_MIN_ANGLE); // Put flipper back against the ground
	}

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
