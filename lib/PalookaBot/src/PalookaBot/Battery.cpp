#include "PalookaBot/Battery.h"

#include <Preferences.h>
#include <cmath>

namespace PalookaBot {
	Battery::Battery(adc1_channel_t adcChannel, float rTop, float rBot, float alpha)
		: channel(adcChannel),
		DIV_RATIO(rBot / (rTop + rBot)),
		SMA_ALPHA(alpha),
		smoothedV(0.0f),
		calibrationFactor(1.0f)
	{ }

	void Battery::begin() {
		adc1_config_width(ADC_WIDTH_BIT_12);
		adc1_config_channel_atten(channel, ADC_ATTEN_DB_12);
		constexpr uint32_t DEFAULT_VREF = 1100;	// DEFAULT_VREF fallback in mV (esp_adc_cal will try eFuse first)
		esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_12, ADC_WIDTH_BIT_12, DEFAULT_VREF, &adc_chars);

		loadCalibrationFromPrefs();
	}

	// Oversampled raw average
	uint32_t Battery::readRawAverage(uint16_t samples) {
		uint64_t sum = 0;
		for (int i = 0; i < samples; ++i) {
			sum += adc1_get_raw(channel);
			delay(2);
		}
		return (uint32_t)(sum / samples);
	}

	// Read battery voltage in volts (smoothed + calibrated)
	float Battery::readVoltage() {
		uint32_t raw = readRawAverage();
		float adcV = rawToMv(raw) / 1000.0f;	// volts at ADC pin
		float battV_unadjusted = adcV / DIV_RATIO;	// volts at battery (before calibration)
		float battV = battV_unadjusted * calibrationFactor;

		if (smoothedV <= 0.0001f) smoothedV = battV; // initial seed
		smoothedV = (SMA_ALPHA * battV) + ((1.0f - SMA_ALPHA) * smoothedV);
		return smoothedV;
	}

	uint32_t Battery::readMilliVolts() {
		float v = readVoltage();
		return (uint32_t)roundf(v * 1000.0f);
	}

	// Map voltage to percent using thresholds
	int Battery::readPercent() {
		const uint32_t v = readMilliVolts();
		if (v >= FULL_MV) return 100;
		if (v <= FLAT_MV) return 0;
		float frac = (float)(v - FLAT_MV) / (float)(FULL_MV - FLAT_MV);
		return (int)roundf(frac * 100.0f);
	}

	bool Battery::isCharging(bool disregardCalibration) {
		// Only apply calibrationFactor if we're not disregarding it and it's sane
		bool badStoredFactor = (!isfinite(calibrationFactor) || calibrationFactor < 0.1f || calibrationFactor > 10.0f);
		float factor = (disregardCalibration || badStoredFactor) ? 1.0f : calibrationFactor;

		// Get a quick unsmoothed reading at ADC pin
		uint32_t raw = readRawAverage(8); // fewer samples = fast response
		float battMv = rawToMv(raw) / DIV_RATIO;

		return battMv * factor >= (float)CHARGING_MV;
	}

	bool Battery::calibrate(uint32_t knownMv, uint16_t samples) {
		if (isCharging(true)) return false; // Don't calibrate if charging, and ignore current calibrationFactor

		uint32_t raw = readRawAverage(samples);	// Larger sample (128) for better result
		uint32_t adcMv = rawToMv(raw);
		float measuredBattV_unadjusted = ((float)adcMv / 1000.0f) / DIV_RATIO; // volts
		float knownV = (float)knownMv / 1000.0f;

		if (measuredBattV_unadjusted <= 0.0001f) {
			calibrationFactor = 1.0f;
		} else {
			calibrationFactor = knownV / measuredBattV_unadjusted;
			if(!isfinite(calibrationFactor) || calibrationFactor < 0.1f || calibrationFactor > 10.0f) calibrationFactor = 1.0f;
		}

		return saveCalibrationToPrefs();
	}

	// load calibration (call from begin())
	bool Battery::loadCalibrationFromPrefs() {
		Preferences prefs;
		prefs.begin(PREFS_NAMESPACE, true); // read-only
		float stored = prefs.getFloat(PREFS_CALIBRATION_FACTOR, 1.0f);
		prefs.end();

		// sanity check: reject ridiculous values
		if (!isfinite(stored) || stored < 0.1f || stored > 10.0f) {
			calibrationFactor = 1.0f;
			return false;
		}
		calibrationFactor = stored;
		return true;
	}

	bool Battery::saveCalibrationToPrefs() {
		// Only write if changed sufficiently (avoid flash wear)
		Preferences prefs;
		prefs.begin(PREFS_NAMESPACE, false); // open for write
		float prev = prefs.getFloat(PREFS_CALIBRATION_FACTOR, 1.0f);
		if (std::fabs(prev - calibrationFactor) > 1e-4f) {
			prefs.putFloat(PREFS_CALIBRATION_FACTOR, calibrationFactor);
			prefs.end();
			return true;
		}
		prefs.end();
		return false;
	}
}
