module.exports.config = {
  tests: './*_test.js',
  timeout: 10000,
  output: './output',
  helpers: {
    WebDriver: {
      url: 'https://netflix.github.io/pollyjs',
      browser: 'chrome',
      // host: TestHelper.seleniumHost(),
      // port: TestHelper.seleniumPort(),
      // disableScreenshots: true,
      // desiredCapabilities: {
      //   chromeOptions: {
      //     args: ['--headless', '--disable-gpu', '--window-size=1280,1024'],
      //   },
      // },
    },
    MockRequestHelper: {
      require: '../index.js'
    },
  },
  include: {},
  bootstrap: done => setTimeout(done, 5000), // let's wait for selenium
  mocha: {},
  name: 'acceptance',
};
