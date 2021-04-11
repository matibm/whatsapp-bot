# Video/Audio format converter
### Video/Audio format converter that uses ffmpeg and fluent-ffmpeg

[![Build Status](https://travis-ci.org/ThaCoderr/format-converter.svg?branch=master)](https://travis-ci.org/ThaCoderr/format-converter)

### installation

`npm install video-converter`

you should also have [ffmpeg](https://ffmpeg.org/) installed on your machine

### usage

```javascript

var converter = require('format-converter');

converter.setFfmpegPath("path/to/ffmpeg", function(err) {
	if (err) throw err;
});

// convert mp4 to mp3
converter.convert("sample.mp4", "sample.mp3", function(err) {
	if (err) throw err;
	console.log("done");
});

```
