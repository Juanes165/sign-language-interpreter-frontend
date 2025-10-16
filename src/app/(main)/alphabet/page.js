'use client';
import { useEffect, useRef, useState } from "react";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import ToggleSwitch from "@/components/utils/ToggleSwitch";

export default function AlphabetHome() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [resolution, setResolution] = useState({ width: null, height: null });
  const [handPresence, setHandPresence] = useState(null);

  const [showLandmarks, setShowLandmarks] = useState(false)
  const showLandmarksRef = useRef(showLandmarks);

  const [curretGesture, setCurrentGesture] = useState(null)

  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
  }, [showLandmarks]);


  useEffect(() => {
    let gestureRecognizer;
    let animationFrameId;


    const drawLandmarks = (landmarksArray) => {

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';

      landmarksArray.forEach(landmarks => {
        landmarks.forEach((landmark, index) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI); // Draw a circle for each landmark
          // ctx.fillText(index, x, y);
          ctx.fill();

            // Conectar puntos específicos con líneas
            const fingerConnections = [
              [0, 1, 5, 9, 13, 17, 0],
              [1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12],
              [13, 14, 15, 16],
              [17, 18, 19, 20],
            ];

            ctx.strokeStyle = '#591da9'; // o cualquier color
            ctx.lineWidth = 0.1;

            fingerConnections.forEach(connection => {
              ctx.beginPath();
              connection.forEach((index, i) => {
                const x = landmarks[index].x * canvas.width;
                const y = landmarks[index].y * canvas.height;

                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              });
              ctx.stroke();
            });
        });
      });
    };

    const detectHands = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const detections = gestureRecognizer.recognizeForVideo(videoRef.current, performance.now());

        setHandPresence(detections.handednesses.length > 0);

        if (detections.gestures.length) {
          setCurrentGesture(detections.gestures[0][0].categoryName);
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Assuming detections.landmarks is an array of landmark objects
        if (detections.landmarks && showLandmarksRef.current) {
          drawLandmarks(detections.landmarks);
        }
      }
      requestAnimationFrame(detectHands);
    };


    const initializeHandDetection = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        gestureRecognizer = await GestureRecognizer.createFromOptions(
          vision, {
          baseOptions: { modelAssetPath: 'models/gesture_recognizer.task' },
          numHands: 1,
          runningMode: "video"
        }
        );
        detectHands();
      } catch (error) {
        console.error("Error initializing hand detection:", error);
      }
    };

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        console.log(settings)
        setResolution({ width: settings.width, height: settings.height });

        await initializeHandDetection();
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    startWebcam();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (gestureRecognizer) {
        gestureRecognizer.close();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <>
      <div className="px-16 py-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-8">

        {/* CAMERA */}
        <div className="w-160 h-120 overflow-hidden relative bg-main-dark rounded-4xl">
          <video
            className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover"
            ref={videoRef}
            autoPlay
            playsInline
          ></video>
          <canvas className="absolute top-0 left-0 w-full h-full z-10" ref={canvasRef} style={{ backgroundColor: "transparent", width: "640px", height: "480px" }}></canvas>
        </div>


        {/* RIGHT DIV, OPTIONS */}
        <div className="flex flex-col w-72 pt-6">

          <span className="text-2xl font-semibold items-center self-center">Configuración</span>

          {/* CONFIG OPTIONS */}
          <div>
            <div className="space-x-3 flex flex-row items-center my-4">
              <ToggleSwitch checked={showLandmarks} setChecked={setShowLandmarks}/>
              <span>Mostrar landmarks</span>
            </div>
            <div className="space-x-3 flex flex-row items-center my-4">
              <ToggleSwitch />
              <span>Habilitar multimanos</span>
            </div>
            <div className="space-x-3 flex flex-row items-center my-4">
              <ToggleSwitch />
              <span>No me acuerdo</span>
            </div>

          </div>

          <span className="text-4xl items-center">Letra {curretGesture && labels_dict[curretGesture]}</span>
        </div>



      </div>
    </>
  )
}


function mapVideoToCanvasCover(xA, yA, videoWidth, videoHeight, canvasWidth, canvasHeight) {
  // Escala como 'cover' en este caso: mayor de los dos ratios
  const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);

  // En este caso sabemos que solo hay offset en Y (alto)
  const displayHeight = videoHeight * scale;
  const offsetY = (canvasHeight - displayHeight) / 2;

  // No hay offset horizontal porque el video cubre todo el ancho
  const xB = xA * scale;
  const yB = yA * scale + offsetY;

  return { x: xB, y: yB };
}



const labels_dict = {
  "0": "A", "1": "B", "2": "C", "3": "D", "4": "E", "5": "F", "6": "G", "7": "H", "8": "I",
  "9": "J", "10": "K", "11": "L", "12": "M", "13": "N", "14": "Ñ", "15": "O", "16": "P",
  "17": "Q", "18": "R", "19": "S", "20": "T", "21": "U", "22": "V", "23": "W", "24": "X",
  "25": "Y", "26": "Z", "": ""
}