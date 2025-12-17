import * as path from 'path';
import * as fs from 'fs';
import * as Mocha from 'mocha';

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '.');

	return new Promise((resolve, reject) => {
		try {
			// Find all test files
			const files = fs.readdirSync(testsRoot)
				.filter(file => file.endsWith('.test.js'))
				.map(file => path.resolve(testsRoot, file));

			// Add files to the test suite
			files.forEach(f => mocha.addFile(f));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						reject(new Error(`${failures} tests failed.`));
					} else {
						resolve();
					}
				});
			} catch (err) {
				console.error(err);
				reject(err);
			}
		} catch (err) {
			return reject(err);
		}
	});
}
