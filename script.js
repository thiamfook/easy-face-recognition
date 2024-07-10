const imgUpload = document.getElementById("imageUpload");
const lblImgUpload = document.getElementById("lblImgUpload");
const statusDiv = document.getElementById("status");

imgUpload.style.display = "none";
lblImgUpload.style.display = "none";
statusDiv.innerText = "Loading...";

// Load the face recognition models
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
]).then(start);

async function start() {
  statusDiv.innerText = "Models loaded, studying faces...";
  const container = document.createElement("div");
  container.style.position = "relative";
  document.body.append(container);

  // learn from labeled images
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  lblImgUpload.style.display = "";
  imgUpload.style.display = "";
  statusDiv.innerText = "Ready";

  let image;
  let canvas;
  imgUpload.addEventListener("change", async () => {
    // Clears the previous result if any
    if (image) image.remove();
    if (canvas) canvas.remove();

    statusDiv.innerText = "Detecting faces";
    // Loads the uploaded image
    image = await faceapi.bufferToImage(imgUpload.files[0]);
    // Shows the uploaded image
    container.append(image);
    // Canves to show the names of detected faces
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);

    // Check the uploaded image
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      drawBox.draw(canvas);
    });
    statusDiv.innerText = "Done";
  });
}

// Faces learning
function loadLabeledImages() {
  // Array of faces to be recognized
  const labels = ["Kui", "Keung", "Paul", "Wing"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      // Loops 6 images per face
      for (let i = 1; i <= 6; i++) {
        const img = await faceapi.fetchImage(
          `labeled_images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        // Pushes the result if there is a face detected
        if (detections?.descriptor) descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
