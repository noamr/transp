
module.exports = {
	launch: {
		dumpio: true,
		headless: true,
		args: ['--disable-infobars'],
	},
	server: {
		command: 'PORT=4444 node static-server.js',
		port: 4444
	},
	browserContext: 'default'
};