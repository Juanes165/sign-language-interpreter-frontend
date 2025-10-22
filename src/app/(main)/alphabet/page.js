'use client';
import { useEffect, useRef, useState } from "react";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { ToggleSwitch, NumberInput } from "@/components/common";
import { getVideoConstraints } from "@/lib";
import { HandIcon, CameraIcon } from "@/utils/icons";

export default function AlphabetHome() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [debug, setDebug] = useState(null);

  const [loadingWebcam, setLoadingWebcam] = useState(true);

  const [showLandmarks, setShowLandmarks] = useState(false);
  const showLandmarksRef = useRef(showLandmarks);

  const [enableMultihands, setEnableMultihands] = useState(false);
  const [numberOfHands, setNumberOfHands] = useState(1)

  const [curretGesture, setCurrentGesture] = useState('');
  const [currentGestureScore, setCurrentGestureScore] = useState(0);

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
        landmarks.forEach((landmark) => {

          // Fix the video proportions with the canvas to draw the landmarks points in the correct place
          const videoRelativeWidth = canvas.height * video.videoWidth / video.videoHeight;
          const diffX = (videoRelativeWidth - canvas.width) / 2

          const x = landmark.x * videoRelativeWidth - diffX;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI); // Draw a circle for each landmark
          ctx.fill();

          // Landmarks to connect
          const fingerConnections = [
            [0, 1, 5, 9, 13, 17, 0],  // Palm
            [1, 2, 3, 4],             // Thumb
            [5, 6, 7, 8],             // Index
            [9, 10, 11, 12],          // Middle
            [13, 14, 15, 16],         // Ring
            [17, 18, 19, 20],         // Pinky
          ];

          ctx.strokeStyle = '#591da9'; // Purple
          ctx.lineWidth = 0.2;

          fingerConnections.forEach(connection => {
            ctx.beginPath();
            connection.forEach((index, i) => {
              const x = landmarks[index].x * videoRelativeWidth - diffX;
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

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video && video.readyState >= 2) {
        const detections = gestureRecognizer.recognizeForVideo(videoRef.current, performance.now());

        if (detections.gestures.length) {
          setCurrentGesture(detections.gestures[0][0].categoryName);
          setCurrentGestureScore(detections.gestures[0][0].score)
        }
        else {
          setCurrentGesture('');
          setCurrentGestureScore(1);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Assuming detections.landmarks is an array of landmark objects
        if (detections.landmarks && showLandmarksRef.current) {
          drawLandmarks(detections.landmarks);
        }
      }


      requestAnimationFrame(detectHands);
    };


    const initializeHandDetection = async (numberOfHands = 1) => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: { modelAssetPath: 'models/gesture_recognizer.task' },
          numHands: numberOfHands,
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

        const videoConstraints = getVideoConstraints();

        const stream = await navigator.mediaDevices.getUserMedia({ video: { ...videoConstraints, facingMode: "user" } });

        videoRef.current.srcObject = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.oncanplay = () => {
            setLoadingWebcam(false);
            videoRef.current.play();
          }

        }

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

  useEffect(() => {
    const resizeCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;

      if (container && canvas) {
        const rect = container.getBoundingClientRect();

        // Establece el tamaño físico del canvas (resolución)
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Asegura que se vea bien
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Opcional: redibujar algo
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Inicial
    resizeCanvas();

    // También ajustar al redimensionar la ventana
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <>
      <div className="text-amethyst text-4xl md:text-5xl text-center w-full font-semibold mt-8 mb-2">INTERPRETADOR</div>
      <div className="px-8 md:px-20 py-8 flex flex-col lg:flex-row space-x-10 justify-between">
            {/* <span>{debug}</span> */}

        {/* CAMERA */}
        <section ref={containerRef} className="w-full aspect-[3/4] md:aspect-[4/3] xl:aspect-[16/9] xl:w-[740px] 2xl:w-[970px] relative bg-main-dark rounded-4xl">
          {loadingWebcam && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  text-platinum flex flex-col items-center">
              <CameraIcon className="text-platinum w-40 h-40"/>
              <span className="text-3xl text-center font-semibold">Cargando tu cámara</span>
            </div>
          )}
          <video
            className={`${loadingWebcam ? 'hidden' : 'block'} absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover rounded-4xl`}
            ref={videoRef}
            autoPlay
            playsInline
          />
          <canvas className={`${loadingWebcam ? 'hidden' : 'block'} absolute top-0 left-0 w-full h-full z-10 rounded-4xl`} ref={canvasRef}></canvas>
        </section>


        {/* RIGHT DIV, OPTIONS */}
        <section className="flex flex-col w-full pt-6 max-w-80 justify-center items-center self-center">

          <div className="flex px-4 space-x-2 items-center justify-between">
            <HandIcon width="72" height="72" className="text-amethyst"/>
            <div className="w-20 flex justify-center">
              <span className="text-7xl font-semibold text-amethyst">{labels_dict[curretGesture] || '—'}</span>
            </div>
            <div className="w-32 flex justify-end">
              <span className="text-5xl font-semibold text-wisteria self-center">{Math.trunc(currentGestureScore * 100) + "%" || '-'}</span>
            </div>
          </div>

          {/* CONFIG OPTIONS */}
          <div className="mt-10">
            <div className="space-x-3 flex flex-row items-center justify-center my-4">
              <ToggleSwitch checked={showLandmarks} setChecked={setShowLandmarks} />
              <span className="text-xl">Mostrar landmarks</span>
            </div>
            {/* <div className="space-x-3 flex flex-row items-center my-4">
              <ToggleSwitch checked={enableMultihands} setChecked={setEnableMultihands}/>
              <span className="text-xl">Habilitar multimanos</span>
              <NumberInput />
            </div>
            <div className="space-x-3 flex flex-row items-center my-4">
              <ToggleSwitch />
              <span className="text-xl">Completar palabras</span>
            </div> */}

          </div>

        </section>



      </div>
    </>
  )
}


const labels_dict = {
  "0": "A", "1": "B", "2": "C", "3": "D", "4": "E", "5": "F", "6": "G", "7": "H", "8": "I",
  "9": "J", "10": "K", "11": "L", "12": "M", "13": "N", "14": "Ñ", "15": "O", "16": "P",
  "17": "Q", "18": "R", "19": "S", "20": "T", "21": "U", "22": "V", "23": "W", "24": "X",
  "25": "Y", "26": "Z", "": ""
}