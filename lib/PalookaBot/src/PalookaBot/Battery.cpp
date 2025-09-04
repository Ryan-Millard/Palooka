#include "Battery.h"

Battery::Battery(adc1_channel_t adcChannel, float rTop, float rBot, uint16_t samples, float alpha)
	: channel(adcChannel),
	DIV_RATIO(rBot / (rTop + rBot)),
	SAMPLES(samples),
	SMA_ALPHA(alpha),
	smoothedV(0.0f),
	calibrationFactor(1.0f)
{ }

void Battery::begin() {
	adc1_config_width(ADC_WIDTH_BIT_12);
	adc1_config_channel_atten(channel, ADC_ATTEN_DB_12);
	constexpr uint32_t DEFAULT_VREF = 1100;	// DEFAULT_VREF fallback in mV (esp_adc_cal will try eFuse first)
	esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_12, ADC_WIDTH_BIT_12, DEFAULT_VREF, &adc_chars);
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
	float adcV = (float)rawToMv(raw) / 1000.0f;	// volts at ADC pin
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
	float frac = (v - FLAT_MV) / (FULL_MV - FLAT_MV);
	return (int)roundf(frac * 100.0f);
}

// safe calibrate: only accept calibration when not charging
void Battery::calibrateUsingVccRail(uint32_t knownMv) {
	if (isCharging()) return;

	uint32_t raw = readRawAverage(128);	// Larger sample (128) for better result
	uint32_t adcMv = rawToMv(raw);
	float measuredBattV_unadjusted = ((float)adcMv / 1000.0f) / DIV_RATIO; // volts
	float knownV = (float)knownMv / 1000.0f; // volts (3.3)
											 // If measured indicates charging (e.g. > 4.3V), abort calibration

	if (measuredBattV_unadjusted <= 0.0001f) {
		calibrationFactor = 1.0f;
		return;
	}

	calibrationFactor = knownV / measuredBattV_unadjusted;
}
