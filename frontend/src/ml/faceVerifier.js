import * as faceapi from "face-api.js";

export async function verifyFace(idImage, videoElement) {

    const idDescriptor = await faceapi
        .detectSingleFace(idImage)
        .withFaceLandmarks()
        .withFaceDescriptor();

    const liveDescriptor = await faceapi
        .detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!idDescriptor || !liveDescriptor) return false;

    const distance = faceapi.euclideanDistance(
        idDescriptor.descriptor,
        liveDescriptor.descriptor
    );

    return distance < 0.5;
}