import * as use from "@tensorflow-models/universal-sentence-encoder"
import "@tensorflow/tfjs"

// This variable is storing the model Promise so that the `use.load` function only called if the Promise hasn't been assigned
let modelPromise: any = null

async function loadModel() {
  if (!modelPromise) {
    modelPromise = use.load()
  }
  return modelPromise
}

export default loadModel
