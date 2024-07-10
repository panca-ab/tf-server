const use = require("@tensorflow-models/universal-sentence-encoder")
const tf = require("@tensorflow/tfjs")

let modelPromise

async function loadModel() {
  if (!modelPromise) {
    modelPromise = use.load()
  }
  return modelPromise
}

module.exports = loadModel
