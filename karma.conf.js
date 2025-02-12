// Karma configuration
// Generated on Mon May 04 2015 16:02:05 GMT+0530 (IST)
// Some of the config is taken from https://github.com/johnpapa/ng-demos/blob/da229019ebf5b1b2867eaf01c4212e9e206272f4/modular/karma.conf.js

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon', 'chai-sinon'],


    // list of files / patterns to load in the browser
    files: [
        './node_modules/ng-midway-tester/src/ngMidwayTester.js',


        /* Vendor */ // Move these to a json file & reuse it in grunt config as well
        './static/js/vendor.js',
        // 'bower_components/angular-mocks/angular-mocks.js',
        './static/js/app.js',


        /* MOCHA */
        'src/test/lib/specHelper.js',
        'src/test/lib/mockData.js',


        'src/test/**/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'src/app/**/*.js': 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    coverageReporter: {
        type: 'lcov',
        dir: 'src/test/coverage'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
