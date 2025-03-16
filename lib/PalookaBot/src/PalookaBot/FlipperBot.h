#ifndef PALOOKABOT_FLIPPERBOT_H
#define PALOOKABOT_FLIPPERBOT_H
#include <Arduino.h>
#include <ESP32Servo.h>
#include "Motor.h"

namespace PalookaBot
{
	// FlipperBot represents a two-wheeled battlebot based on the Mootbotv1_241122 hardware.
	// It uses two Motor objects to control the left and right wheels.
	class FlipperBot
	{
		private:
			// ========== GPIO Pins ==========
			const byte EN8V_PIN; // Motor enabler pin fo
			const byte EN5V_PIN; // Servo
										// Read battery charge with analogRead(36)
										// 4.5V = charging, otherwise battery
										// 4.2 = fully charged battery
										// 3.7 = flat for battery - switch off device
			const byte DVR_SLEEP_PIN;	// Motors use for charging - switch to low when charging

			// ========== Flipper/Arm ==========
			const byte FLIPPER_PIN; // See flipper below
			Servo flipper; // The arm on the robot that flips other robots
			const byte FLIPPER_MAX_ANGLE;
			const byte FLIPPER_MIN_ANGLE;

			// ========== Wheels ==========
			// Each Motor instance controls one wheel.
			const Motor wheelRight; // Motor A
			const Motor wheelLeft; // Motor B (configured as inverted to match the physical layout of the robot)

			// ========== LED ==========
			const byte LED_PIN;

			// ========== BATTERY ==========
			const byte BATTERY_PIN;
		public:
			// ========== Constructor function ==========
			// The default parameters correspond to the recommended hardware configuration.
			FlipperBot(const byte FLIPPER_PIN = 14,
					const byte LEFT_PWM_PIN = 25, const byte LEFT_DIRECTION_PIN = 26,
					const byte RIGHT_PWM_PIN = 32, const byte RIGHT_DIRECTION_PIN = 33,
					const byte LED_PIN = 2,
					const byte EN8V_PIN = 16, const byte EN5V_PIN = 17, const byte DVR_SLEEP_PIN = 12,
					const byte BATTERY_PIN = 36);
			void begin();

			// LED functions
			void setLedOn(const bool isOn) const;

			// Tone functions
			void playTone(int frequency, int duration_ms) const;
			void playStartupTone() const;

			// ========== Flipper Movement functions ==========
			void moveFlipper(byte angle);
			void flip();

			// ========== Wheel movement functions ==========
			// move() allows for driving the robot using x (lateral/turning) and y (forward/backward) values.
			// Inputs are expected to be within [-1, 1] and will be normalized if necessary.
			void move(const float x, const float y) const;
			// These functions allow for direct control of the individual wheels.
			// Note: Due to the inversion, moveLeftWheel causes a turn to the right and vice versa.
			void moveLeftWheel(const short velocity) const; // Controls the left wheel's rotation.
			void moveRightWheel(const short velocity) const; // Controls the right wheel's rotation.
															 // stopMoving() halts all movement by stopping both wheels.
			void stopMoving() const;

			int getBatteryPercentage() const;
	};
}
#endif
