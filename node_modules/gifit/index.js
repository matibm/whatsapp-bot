import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';
import Promise from 'bluebird';

function getConversionCommand(inputFilePath, outputFilePath) {
  // http://mwholt.blogspot.com/2014/08/convert-video-to-animated-gif-with.html
  return `ffmpeg -i ${inputFilePath} -r 20 -f image2pipe -vcodec ppm - | convert -delay 5 - gif:- | convert -layers Optimize - ${outputFilePath}`;
}

export default function gifit(opts) {
  const inputFilePath = opts.input;
  const outputFilePath = opts.output;
  return new Promise((resolve, reject) => {
    // Get absolute paths for input and output files
    const absoluteInputFilePath = path.resolve(inputFilePath);
    const absoluteOutputFilePath = path.resolve(outputFilePath);

    fileExists(absoluteInputFilePath)
    .then(() => {
      // Get conversion command
      const cmd = getConversionCommand(inputFilePath, outputFilePath)

      // Execute conversion command
      exec(cmd, (error, stdout, stderr) => {
        // Error handling
        if (error) {
          reject(error);
        } else {
          resolve({
            stdout,
            stderr,
          });
        }
      });
    })
    .catch(FileExistsError, (err) => {
      reject(err)
    })
    .catch((err) => {
      reject(err)
    })
  });
}

function fileExists(path) {
  return new Promise((resolve, reject) => {
    try {
      fs.access(path, fs.F_OK, function(err) {
        if (err) {
          reject(new FileExistsError(path))
        } else {
          resolve()
        }
      });
    } catch(error) {
      throw error;
    }
  })
}

class FileExistsError {
  constructor(fileName) {
    this.name = 'MyError';
    this.message = `File doesn't exist: ${fileName}`;
    this.stack = new Error().stack; // Optional
  }
}
FileExistsError.prototype = Object.create(Error.prototype);
