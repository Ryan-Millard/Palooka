#ifndef PALOOKABOT_MOTOR_H
#define PALOOKABOT_MOTOR_H

namespace PalookaBot
{
	class Motor
	{
		private:
			const byte PWM_OUT_PIN; // Data Pin
			const byte DIRECTION_PIN; // Sets forwards/backwards

			bool isInverted; // Flag to track whether the rotation direction is inverted

		public:
			Motor(const byte PWM_OUT_PIN, const byte DIRECTION_PIN, const bool isInverted = false);

			void rotate(short speed) const;
			void stop() const;

			inline void toggleInversion() { isInverted = !isInverted; }
			inline bool getInversionState() const { return isInverted; }
	};
}

#endif
