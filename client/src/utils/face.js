import * as faceapi from "face-api.js";

let modelsLoaded = false;

const LOCAL_MODEL_PATH = "/models";
const CDN_MODEL_PATH = "https://justadudewhohacks.github.io/face-api.js/models";

const loadAllModelsFrom = async (path) => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(path),
    faceapi.nets.faceLandmark68Net.loadFromUri(path),
    faceapi.nets.faceRecognitionNet.loadFromUri(path)
  ]);
};

export const loadFaceModels = async () => {
  if (modelsLoaded) return;

  try {
    await loadAllModelsFrom(LOCAL_MODEL_PATH);
    modelsLoaded = true;
    return;
  } catch (_localError) {
    try {
      await loadAllModelsFrom(CDN_MODEL_PATH);
      modelsLoaded = true;
      return;
    } catch (_cdnError) {
      throw new Error(
        "Face model files are missing. Add model files to client/public/models and restart client."
      );
    }
  }
};

export const extractDescriptor = async (videoEl) => {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return Array.from(detection.descriptor);
};
