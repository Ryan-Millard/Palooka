import { defineConfig } from 'vite';
import { resolve } from 'path'
import { glob } from 'glob'

const htmlFiles = glob.sync('*.html')

export default defineConfig({
	root: '.',          // The project root (frontend folder)
	base: './',         // Use relative paths for ESP32
	build: {
		outDir: '../data', // Output folder for PlatformIO SPIFFS/LittleFS
		emptyOutDir: true, // Clear it before building
		rollupOptions: {
			// Include all HTML files
			input: htmlFiles.reduce((inputs, file) => {
				const name = file.replace(/\.html$/, '')
				inputs[name] = resolve(__dirname, file)
				return inputs
			}, {})
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src/'),
		},
	},
});
