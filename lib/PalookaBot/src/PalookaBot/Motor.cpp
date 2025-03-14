#include <Arduino.h>

#include "Motor.h"

namespace PalookaBot
{
	// ========== Private ==========
	// No additional private members or helper functions are declared here.

	// ========== Public ==========
	// PWM_OUT_PIN - Controls speed of the motor
	// DIRECTION_PIN - Controls direction of rotation of the motor
	// isInverted - Determines default rotation direction
	Motor::Motor(const byte PWM_OUT_PIN, const byte DIRECTION_PIN, const bool isInverted)
				: PWM_OUT_PIN(PWM_OUT_PIN), DIRECTION_PIN(DIRECTION_PIN), isInverted(isInverted)
	{
		// Set up required GPIO pins
		pinMode(PWM_OUT_PIN, OUTPUT); // Speed pin
		pinMode(DIRECTION_PIN, OUTPUT); // Rotation direction pin
	}

	// Expects velocity to be equal to or between -255 and 255.
	// Normalises velocity if it isn't.
	void Motor::rotate(short velocity) const
	{
		const byte MAX_MOTOR_SPEED = 255;

		if(velocity == 0) // Early return if stop is needed
		{
			stop();
			return;
		}

		// Limit velocity to the required bounds
		velocity = constrain(velocity, -MAX_MOTOR_SPEED, MAX_MOTOR_SPEED);  // Limit to valid speed range
		// Flip the direction if the motor is inverted
		velocity = (isInverted) ? (velocity * -1 /* Invert velocity back to normalise it */) : velocity;

		bool isForwardDirection{true}; // Determines direction of the motor
		if(velocity < 0) // This means the motor moves in a negative direction (backwards)
		{
			isForwardDirection = false; // Motor is moving backwards
			// Ensure velocity >= 0 using abs(), since velocity was constrained, it cannot be greater than 255
			velocity = MAX_MOTOR_SPEED - abs(velocity); // Fix polarity (velocity is made positive to allow subtraction)
		}

		// ========== Write data ==========
		digitalWrite(DIRECTION_PIN, isForwardDirection ? LOW /* Forwards */ : HIGH /* Backwards */); // Write direction
		analogWrite(PWM_OUT_PIN, velocity); // Write speed
	}

	// Completely halts the motor's motion
	void Motor::stop() const
	{
		digitalWrite(DIRECTION_PIN, LOW); // Direction does not matter since it is stopped
		analogWrite(PWM_OUT_PIN, 0); // Set speed to 0
	}

	void Motor::playTone(int frequency, int duration_ms) const
	{
		// Calculate the delay for half a wave (in microseconds)
		int halfPeriod_us = 1000000 / (2 * frequency);
		unsigned long endTime = millis() + duration_ms;

		while (millis() < endTime)
		{
			// Alternate outputs to generate the tone/vibration effect
			digitalWrite(PWM_OUT_PIN, HIGH);
			digitalWrite(DIRECTION_PIN, LOW);
			delayMicroseconds(halfPeriod_us);

			digitalWrite(PWM_OUT_PIN, LOW);
			digitalWrite(DIRECTION_PIN, HIGH);
			delayMicroseconds(halfPeriod_us);
		}

		// Ensure the motor is stopped after playing the tone
		digitalWrite(PWM_OUT_PIN, LOW);
		digitalWrite(DIRECTION_PIN, LOW);
	}
}
