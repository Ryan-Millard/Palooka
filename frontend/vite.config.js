import { defineConfig } from 'vite';

export default defineConfig({
	root: '.',          // The project root (frontend folder)
	base: './',         // Use relative paths for ESP32
	build: {
		outDir: '../data', // Output folder for PlatformIO SPIFFS/LittleFS
		emptyOutDir: true, // Clear it before building
	},
});
