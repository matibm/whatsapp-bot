## gifit [![Build Status](https://travis-ci.org/joegesualdo/gifit.svg?branch=master)](https://travis-ci.org/joegesualdo/gifit)
> Quickly convert video to high quality GIF.

## Install
```
$ npm install --save gifit
```

## Usage
```javascript
import gifit from 'gifit'

let inputPath = '/Users/joe/example.mov';
let outputPath = '/Users/joe/test.gif';

gifit({
  input: '/Users/joe/example.mov',
  output: '/Users/joe/test.gif',
})
.then(result => {
  console.log('Converted Successfully!')
})
.catch(error => {
  console.log(err)
})
```

## API
### `gifit([options])`
> Converts a video to gif

#### Options
| Name |   Type  | Default |   Description    |
|------|---------|---------|------------------|
| input | `string` |   `N/A`   | Path to video file you want to convert|
| output | `string` |   `N/A`   | Path you want the gif to be placed

```javascript
import gifit from 'gifit'

gifit({
  input: '/Users/joe/example.mov',
  output: '/Users/joe/test.gif',
})
.then(result => {
})
.catch(error => {
  console.log(err)
})

```

## Test
```
$ npm test
```
## Build
```
$ npm run build
```

## Related
- [gifit-cli](https://github.com/joegesualdo/gifit-cli) - CLI for this module.

## License
MIT © [Joe Gesualdo]()
