const gifit = require('./../dist').default
const path = require('path')

let inputPath = path.resolve('./example.mov')
let outputPath = path.resolve('./test.gif')

gifit({
  input: inputPath,
  output: outputPath
})
.then(result => {
})
.catch(error => {
  console.log(error)
})



