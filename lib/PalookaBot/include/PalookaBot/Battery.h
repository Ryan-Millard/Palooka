#ifndef PALOOKABOT_BATTERY_H
#define PALOOKABOT_BATTERY_H

#include <Arduino.h>
#include "esp_adc_cal.h"
#include "driver/adc.h"

namespace PalookaBot {
	class Battery {
		public:
			// Battery voltage thresholds in millivolts (mV)
			static constexpr uint32_t FLAT_MV = 3300; // 3.3V considered flat
			static constexpr uint32_t HALFWAY_MV = 3600; // 3.6V between flat and full
			static constexpr uint32_t FULL_MV = 3900; // 3.9V considered full
			static constexpr uint32_t CHARGING_MV = 4100; // 4.1V considered charging

			// Pass ADC channel (adc1_channel_t), top & bottom resistors (ohms)
			// E.g. usage: Battery battery(ADC1_CHANNEL_0, 6800.0, 470.0);	// rTop: 6k8 ohm, rBot: 470 ohm
			Battery(adc1_channel_t adcChannel, float rTop, float rBot, float alpha = 0.12f);

			void begin();								// init ADC and calibration

			uint32_t readRawAverage(uint16_t samples = 64);
			float readVoltage();		// battery voltage in volts (smoothed)
			uint32_t readMilliVolts();	// battery voltage in mV (smoothed)
			int readPercent();			// estimated battery % from voltage

			bool isCharging(bool disregardCalibration = false);
			inline bool isLow() { return readMilliVolts() <= FLAT_MV; }

			bool calibrate(uint32_t knownMv = HALFWAY_MV, uint16_t samples = 128);	// calibration without DMM

		private:
			const adc1_channel_t channel; // Channels 1-7 map to GPIO pins 36-39
			const float DIV_RATIO;
			float SMA_ALPHA;
			float smoothedV;	// volts
			float calibrationFactor;	// multiplicative correction on volts (1.0 means no correction)

			esp_adc_cal_characteristics_t adc_chars;

			static constexpr const char *PREFS_NAMESPACE = "PalookaBot";
			static constexpr const char *PREFS_CALIBRATION_FACTOR = "Battery::calibrationFactor";
			bool loadCalibrationFromPrefs();
			bool saveCalibrationToPrefs();

			// raw -> mV at ADC pin using esp_adc_cal
			inline uint32_t rawToMv(uint32_t raw) {
				// esp_adc_cal_raw_to_voltage returns millivolts at ADC pin
				return esp_adc_cal_raw_to_voltage(raw, &adc_chars);
			}
	};
}

#endif
