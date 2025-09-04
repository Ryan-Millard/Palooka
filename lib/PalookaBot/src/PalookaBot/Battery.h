#ifndef PALOOKABOT_BATTERY_H
#define PALOOKABOT_BATTERY_H

#include <Arduino.h>
#include "esp_adc_cal.h"
#include "driver/adc.h"

// TODO: Use Preferences & put this class in a namespace
class Battery {
	public:
		// Battery voltage thresholds in millivolts (mV)
		static constexpr uint32_t FLAT_MV = 3700;		// 3.7V → flat, should be fully drained
		static constexpr uint32_t FULL_MV = 4200;		// 4.2V → fully charged battery
		static constexpr uint32_t CHARGING_MV = 4500;	// 4.5V → charging detected

		// Pass ADC channel (adc1_channel_t), top & bottom resistors (ohms)
		// E.g. usage: Battery battery(ADC1_CHANNEL_0, 6800.0, 470.0);	// rTop: 6k8 ohm, rBot: 470 ohm
		Battery(adc1_channel_t adcChannel, float rTop, float rBot, uint16_t samples = 64, float alpha = 0.12f);

		void begin();								// init ADC and calibration

		uint32_t readRawAverage(uint16_t samples);
		inline uint32_t readRawAverage() { return readRawAverage(SAMPLES); }
		float readVoltage();		// battery voltage in volts (smoothed)
		uint32_t readMilliVolts();	// battery voltage in mV (smoothed)
		int readPercent();			// estimated battery % from voltage

		inline bool isCharging() { return readMilliVolts() > FULL_MV; }
		inline bool isLow() { return readMilliVolts() < FLAT_MV; }

		void calibrateUsingVccRail(uint32_t knownMv = 3300);	// calibration without DMM
		inline void setCalibrationFactor(float factor) { calibrationFactor = factor; }

	private:
		const adc1_channel_t channel; // Channels 1-7 map to GPIO pins 36-39
		const float DIV_RATIO;
		const uint16_t SAMPLES;
		float SMA_ALPHA;
		float smoothedV;	// volts
		float calibrationFactor;	// multiplicative correction on volts (1.0 means no correction)

		esp_adc_cal_characteristics_t adc_chars;

		// raw -> mV at ADC pin using esp_adc_cal
		inline uint32_t rawToMv(uint32_t raw) {
			// esp_adc_cal_raw_to_voltage returns millivolts at ADC pin
			return esp_adc_cal_raw_to_voltage(raw, &adc_chars);
		}
};

#endif // PALOOKABOT_BATTERY_H
