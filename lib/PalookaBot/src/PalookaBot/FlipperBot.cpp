#include "FlipperBot.h"
#include <algorithm> // For std::max and std::abs

namespace PalookaBot
{
	// Initialize static members
	FlipperBot* FlipperBot::instance = nullptr;
	std::mutex FlipperBot::instanceMutex;

	// Static method to get the singleton instance
	FlipperBot& FlipperBot::getInstance()
	{
		std::lock_guard<std::mutex> lock(instanceMutex);
		if (instance == nullptr) {
			// Using default constructor parameters
			instance = new FlipperBot();
		}
		return *instance;
	}

	// Static method to destroy the singleton instance
	void FlipperBot::destroyInstance()
	{
		std::lock_guard<std::mutex> lock(instanceMutex);
		if (instance != nullptr) {
			delete instance;
			instance = nullptr;
		}
	}

	// Private constructor
	FlipperBot::FlipperBot(const byte FLIPPER_PIN,
			const byte LEFT_PWM_PIN, const byte LEFT_DIRECTION_PIN,
			const byte RIGHT_PWM_PIN, const byte RIGHT_DIRECTION_PIN,
			const byte LED_PIN,
			const byte EN8V_PIN, const byte EN5V_PIN, const byte DVR_SLEEP_PIN,
			const byte BATTERY_PIN)
		: EN8V_PIN(EN8V_PIN), EN5V_PIN(EN5V_PIN), DVR_SLEEP_PIN(DVR_SLEEP_PIN),
		FLIPPER_PIN(FLIPPER_PIN),
		FLIPPER_MAX_ANGLE(180), FLIPPER_MIN_ANGLE(0),
		wheelRight(RIGHT_PWM_PIN, RIGHT_DIRECTION_PIN),
		wheelLeft(LEFT_PWM_PIN, LEFT_DIRECTION_PIN, true /* Inverted */),
		LED_PIN(LED_PIN),
		BATTERY_PIN(BATTERY_PIN)
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

		pinMode(LED_PIN, OUTPUT);

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

	void FlipperBot::setLedOn(const bool isOn) const
	{
		digitalWrite(LED_PIN, isOn ? HIGH : LOW);
		Serial.print("LED isOn: ");
		Serial.println(isOn);
	}

	void FlipperBot::playTone(const int frequency, const int duration_ms) const
	{
		static bool rightIsLastWheelUsed{true};

		if(rightIsLastWheelUsed)
		{
			wheelRight.playTone(frequency, duration_ms);
			return;
		}

		wheelLeft.playTone(frequency, duration_ms);
	}
	void FlipperBot::playStartupTone() const
	{
		// Note frequencies in Hz (approximation for the melody)
		// melody:          A4,  A4,  A4,  G4,  F4,  E4,  D4,  A4,  A4,  A4,  G4,  F4,  E4,  C#4, D4
		int melody[] =    {440, 440, 440, 392, 350, 330, 294, 440, 440, 440, 392, 350, 330, 278, 294};
		int durations[] = {300, 300, 400, 200, 400, 200, 300, 300, 300, 400, 200, 400, 200, 500, 1000};

		for(int i = 0; i < 15; ++i) // Playing 15 notes
		{
			playTone(melody[i], durations[i]);
			delay(50); // Small delay between notes for a smooth transition
		}
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

	int FlipperBot::getBatteryPercentage() const
	{
		int adcValue = analogRead(36);
		Serial.print("ADC: ");
		Serial.println(adcValue);
		return adcValue;
	}
}
