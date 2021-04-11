module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = gifit;

	var _path = __webpack_require__(1);

	var _path2 = _interopRequireDefault(_path);

	var _child_process = __webpack_require__(2);

	var _fs = __webpack_require__(3);

	var _fs2 = _interopRequireDefault(_fs);

	var _bluebird = __webpack_require__(4);

	var _bluebird2 = _interopRequireDefault(_bluebird);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function getConversionCommand(inputFilePath, outputFilePath) {
	  // http://mwholt.blogspot.com/2014/08/convert-video-to-animated-gif-with.html
	  return 'ffmpeg -i ' + inputFilePath + ' -r 20 -f image2pipe -vcodec ppm - | convert -delay 5 - gif:- | convert -layers Optimize - ' + outputFilePath;
	}

	function gifit(opts) {
	  var inputFilePath = opts.input;
	  var outputFilePath = opts.output;
	  return new _bluebird2.default(function (resolve, reject) {
	    // Get absolute paths for input and output files
	    var absoluteInputFilePath = _path2.default.resolve(inputFilePath);
	    var absoluteOutputFilePath = _path2.default.resolve(outputFilePath);

	    fileExists(absoluteInputFilePath).then(function () {
	      // Get conversion command
	      var cmd = getConversionCommand(inputFilePath, outputFilePath);

	      // Execute conversion command
	      (0, _child_process.exec)(cmd, function (error, stdout, stderr) {
	        // Error handling
	        if (error) {
	          reject(error);
	        } else {
	          resolve({
	            stdout: stdout,
	            stderr: stderr
	          });
	        }
	      });
	    }).catch(FileExistsError, function (err) {
	      reject(err);
	    }).catch(function (err) {
	      reject(err);
	    });
	  });
	}

	function fileExists(path) {
	  return new _bluebird2.default(function (resolve, reject) {
	    try {
	      _fs2.default.access(path, _fs2.default.F_OK, function (err) {
	        if (err) {
	          reject(new FileExistsError(path));
	        } else {
	          resolve();
	        }
	      });
	    } catch (error) {
	      throw error;
	    }
	  });
	}

	var FileExistsError = function FileExistsError(fileName) {
	  _classCallCheck(this, FileExistsError);

	  this.name = 'MyError';
	  this.message = 'File doesn\'t exist: ' + fileName;
	  this.stack = new Error().stack; // Optional
	};

	FileExistsError.prototype = Object.create(Error.prototype);

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("path");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("child_process");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("fs");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("bluebird");

/***/ }
/******/ ]);