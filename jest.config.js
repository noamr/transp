module.exports = {
  preset: 'jest-puppeteer',
  testRegex: '/__tests__/[^.]+\.(test|spec)\\.[jt]s$',
  "globalSetup": "jest-environment-puppeteer/setup",
  "globalTeardown": "jest-environment-puppeteer/teardown",
  "testEnvironment": "jest-environment-puppeteer",
  transform: {
		"^.+\\.ts?$": "ts-jest"
	},
};