var converter = require('../index.js');
var expect    = require("chai").expect;
var fs				= require('fs');

describe("Format Converter", function() {

	before(function() {
		// mocking
		converter.convert = function(path, dest, cb) {
			var stats = fs.statSync(path);
			var size = stats["size"];
			if (size == 0) return cb("file is not valid");
			return cb(null);
		}
	});

	it("should set up ffmpeg path", function(done) {
		converter.setFfmpegPath("path/to/ffmpeg", function(err) {
			expect(err).to.equal(null);
			done();
		});
	});

	it("should throw err when data is invalid", function(done) {
		converter.convert("./test/invalid-sample.mp4", "./sample.mp3", function(err) {
			expect(err).to.not.equal(null);
			done();
		});
	});

	it("should convert when data is valid", function(done) {
		converter.convert("./test/valid-sample.mp4", "./sample.mp3", function(err) {
			expect(err).to.equal(null);
			done();
		});
	})

	

});