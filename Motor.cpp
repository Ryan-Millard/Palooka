#include <Arduino.h>

#include "Motor.h"

namespace PalookaBot
{
	// Private
	void Motor::initPins()
	{
		// Initialize pins
		pinMode(EN8V_PIN, OUTPUT);
		pinMode(EN5V_PIN, OUTPUT);
		pinMode(DVR_SLEEP_PIN, OUTPUT);
		pinMode(PWM_OUT_PIN, OUTPUT);
		pinMode(DIRECTION_PIN, OUTPUT);
	}

	void Motor::enableDrivers()
	{
		// Enable power and wake up driver
		digitalWrite(EN8V_PIN, HIGH);
		digitalWrite(EN5V_PIN, HIGH);
		digitalWrite(DVR_SLEEP_PIN, HIGH);
	}

	// Public
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
