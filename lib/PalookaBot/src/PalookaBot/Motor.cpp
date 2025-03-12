#include <Arduino.h>

#include "Motor.h"

namespace PalookaBot
{
	// ========== Private ==========

	// ========== Public ==========
	Motor::Motor(const byte PWM_OUT_PIN, const byte DIRECTION_PIN, const bool isInverted)
				: PWM_OUT_PIN(PWM_OUT_PIN), DIRECTION_PIN(DIRECTION_PIN), isInverted(isInverted)
	{
		// Set up required GPIO pins
		pinMode(PWM_OUT_PIN, OUTPUT);
		pinMode(DIRECTION_PIN, OUTPUT);
	}

	void Motor::rotate(short velocity) const
	{
		if(velocity == 0)
		{
			stop();
			return;
		}

		velocity = constrain(velocity, -255, 255);  // Limit to valid PWM range
		velocity = (isInverted) ? (velocity * -1 /* Invert velocity back to normalise it */) : velocity;

		bool isForwardDirection{true};
		if(velocity < 0)
		{
			isForwardDirection = false;
			velocity = 255 - abs(velocity); // Fix polarity (velocity is made positive to allow subtraction)
									 // Ensures velocity > 0 as well
		}

		digitalWrite(DIRECTION_PIN, isForwardDirection ? LOW : HIGH);

		analogWrite(PWM_OUT_PIN, velocity);
	}

	void Motor::stop() const
	{
		digitalWrite(DIRECTION_PIN, LOW);
		analogWrite(PWM_OUT_PIN, 0);
	}
}
