#ifndef PALOOKABOT_MOTOR_H
#define PALOOKABOT_MOTOR_H

namespace PalookaBot
{
	class Motor
	{
		private:
			// ========== GPIO Pins ==========
			const byte PWM_OUT_PIN; // Data Pin - controls speed
			const byte DIRECTION_PIN; // Sets forwards/backwards

			bool isInverted; // Flag to track whether the rotation direction is inverted

		public:
			// ========== Contructor function ==========
			// Assumes the motor travels in the default motor direction using the isInverted flag
			Motor(const byte PWM_OUT_PIN, const byte DIRECTION_PIN, const bool isInverted = false);

			// ========== Movement functions ==========
			// Expects a signed short between -255 and 255.
			// If speed is positive, it moves the motor in the default direction.
			// If speed is negative, it moves the motor in the reverse direction.
			void rotate(short speed) const;
			// Completely halts the motion of the motor
			void stop() const;

			// ========== Direction inversion functions ==========
			// Changes the default direction of the motor by inverting the isInverted flag.
			inline void toggleInversion() { isInverted = !isInverted; }
			// Returns the current inversion state of the motor.
			// If the motor is inverted, it returns true, otherwise, false.
			inline bool getInversionState() const { return isInverted; }
	};
}

#endif
