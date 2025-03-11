#include <Arduino.h>

#include "Motor.h"

namespace HardwareDevices
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
	void Motor::rotate(short speed) const
	{
		Serial.print("Speed before usage: ");
		Serial.println(speed);

		if(speed == 0)
		{
			stop();
			Serial.print("Speed after usage: ");
			Serial.println(speed);
			return;
		}

		speed = constrain(speed, -255, 255);  // Limit to valid PWM range
		speed = (isInverted) ? (speed * -1 /* Invert speed back to normalise it */) : speed;

		bool isForwardDirection{true};
		if(speed < 0)
		{
			isForwardDirection = false;
			speed = 255 - abs(speed); // Fix polarity (speed is made positive to allow subtraction)
									 // Ensures speed > 0 as well
		}

		digitalWrite(DIRECTION_PIN, isForwardDirection ? LOW : HIGH);

		analogWrite(PWM_OUT_PIN, speed);
		Serial.print("Speed after usage: ");
		Serial.println(speed);
	}

	void Motor::stop() const
	{
		digitalWrite(DIRECTION_PIN, LOW);
		analogWrite(PWM_OUT_PIN, 0);
	}
}
