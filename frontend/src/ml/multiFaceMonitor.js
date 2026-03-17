import * as faceapi from "face-api.js";

let modelsLoaded = false;
let monitoringInterval = null;

async function loadModels() {
    if (modelsLoaded) return;

    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    modelsLoaded = true;
}

export async function startMultiFaceMonitoring(videoElement, onSuspicious) {
    await loadModels();

    monitoringInterval = setInterval(async () => {
        if (!videoElement) return;

        const detections = await faceapi.detectAllFaces(
            videoElement,
            new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length !== 1) {
            onSuspicious("Multiple or no faces detected");
        }

    }, 2000); // check every 2 seconds
}

export function stopMultiFaceMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
}