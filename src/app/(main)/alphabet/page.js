'use client';
import { useEffect, useRef, useState } from "react";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { ToggleSwitch, NumberInput } from "@/components/common";
import { getVideoConstraints } from "@/lib";
import { HandIcon, CameraIcon, LandmarksLogo, LandmarksPointsLogo } from "@/utils/icons";

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

  const [curretSign, setCurrentSign] = useState('');
  const [currentSignScore, setCurrentSignScore] = useState(0);

  const [currentWord, setCurrentWord] = useState('');
  const [fullText, setFullText] = useState('');


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
      const targetFPS = 10;
      const frameInterval = 1000 / targetFPS;


      // Buffer de letras recientes (ventana de 1 segundo)
      const bufferSize = 10;
      let letterBuffer = [];

      let confirmedLetter = '';
      let currentWordLetters = [];

      setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');


        if (video && video.readyState >= 2) {
          const detections = gestureRecognizer.recognizeForVideo(video, performance.now());

          // Drawing the landmarks
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detections.landmarks && showLandmarksRef.current) {
            drawLandmarks(detections.landmarks);
          }

          if (!detections.handednesses.length) {

            if (currentWordLetters.length) {
              const currentWord = currentWordLetters.map((curretSign) => labels_dict[curretSign]).join("")
              setFullText(prevFullText => prevFullText + " " + currentWord)
            }

            letterBuffer = [];
            confirmedLetter = '';
            currentWordLetters = [];
          }

          let detectedLetter = null;
          if (detections.gestures.length) {
            detectedLetter = detections.gestures[0][0].categoryName;
            setCurrentSign(labels_dict[detections.gestures[0][0].categoryName]);
            setCurrentSignScore(detections.gestures[0][0].score);
          } else {
            detectedLetter = '';
            setCurrentSign('');
            setCurrentSignScore(0);
          }

          if (detectedLetter || detectedLetter === '') {
            // Keep the last 10 detections in the buffer
            letterBuffer.push(detectedLetter);
            if (letterBuffer.length > bufferSize) letterBuffer.shift();

            // Most frequent letter into the buffer
            const freq = {};
            letterBuffer.forEach(l => (freq[l] = (freq[l] || 0) + 1));
            const [mostCommon, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

            const stabilityThreshold = Math.floor(bufferSize * 0.7);

            // If the most common letter is different, its the new letter to add
            if (count >= stabilityThreshold && mostCommon !== confirmedLetter) {
              confirmedLetter = mostCommon;
              currentWordLetters.push(confirmedLetter);

              const currentWord = currentWordLetters.map((curretSign) => labels_dict[curretSign]).join("")
              setCurrentWord(currentWord);
            }

          }

        }
      }, frameInterval);
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

        const stream = await navigator.mediaDevices.getUserMedia({ video: { ...videoConstraints, facingMode: "user", frameRate: 24 } });

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

        // Set canvas size equal to container div
        canvas.width = rect.width;
        canvas.height = rect.height;

        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
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
      <div className="text-amethyst text-3xl md:text-4xl lg:text-5xl text-center w-full font-semibold py-2 md:py-4 lg:py-8">INTERPRETADOR</div>
      <div className="px-8 md:px-20 pb-8 flex flex-col lg:flex-row space-x-10 justify-between">

        {/* CAMERA */}
        <section ref={containerRef} className="w-full aspect-[3/4] md:aspect-[4/3] xl:aspect-[16/9] xl:w-[740px] 2xl:w-[970px] relative bg-main-dark rounded-4xl">
          {loadingWebcam && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  text-platinum flex flex-col items-center">
              <CameraIcon className="text-platinum w-40 h-40" />
              <span className="text-3xl text-center font-semibold">Cargando tu cámara</span>
            </div>
          )}
          <video
            className={`${loadingWebcam ? 'hidden' : 'block'} absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover rounded-4xl`}
            ref={videoRef}
            autoPlay
            playsInline
          />
          <canvas className={`${loadingWebcam ? 'hidden' : 'block'} absolute top-0 left-0 w-full h-full z-1 rounded-4xl bg-transparent`} ref={canvasRef}></canvas>
          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-wisteria hover:bg-amethyst rounded-full absolute bottom-2 right-2 lg:bottom-5 lg:right-5 cursor-pointer z-2">
            <button className="relative w-full h-full cursor-pointer" onClick={() => setShowLandmarks(!showLandmarks)}>
              <LandmarksLogo className="w-14 h-14 lg:w-20 lg:h-20 rotate-12 text-main-light absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <LandmarksPointsLogo className="w-14 h-14 lg:w-20 lg:h-20 rotate-12 text-grape absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </button>
          </div>
        </section>


        {/* RIGHT DIV, OPTIONS */}
        <section className="flex flex-col w-full pt-6 lg:max-w-80 2xl:max-w-96 justify-center items-center self-center">

          <div className="flex px-4 space-x-2 items-center justify-between">
            <HandIcon width="72" height="72" className="text-amethyst" />
            <div className="w-20 flex justify-center">
              <span className="text-7xl font-semibold text-amethyst">{curretSign || '—'}</span>
            </div>
            <div className="w-32 flex justify-end">
              <span className="text-5xl font-semibold text-wisteria self-center">{Math.trunc(currentSignScore * 100) + "%" || '-'}</span>
            </div>
          </div>

          {/* CONFIG OPTIONS */}
          <div className="mt-10 w-full">
            <div className="flex flex-row lg:flex-col px-4 justify-center" onClick={() => setCurrentWord('')}>
              <span className="w-auto min-w-60 text-3xl text-center py-2 border-3 rounded-lg border-amethyst text-amethyst font-semibold truncate">{currentWord || '—'}</span>
              {/* <span className="invisible text-2xl text-center py-2 mx-2 border-2 border-t-0 rounded-b-lg border-amethyst">Recomendación1</span>
              <span className="invisible text-2xl text-center py-2.5 mx-2 border-2 border-t-0 rounded-b-lg border-amethyst transform -translate-y-1.5">Recomendación2</span> */}
            </div>
            <div
              className="mt-5 py-4 px-8 text-center cursor-pointer border-2 border-platinum border-dashed rounded-lg dotted"
              onClick={() => setFullText('')}
            >
              <span className="text-xl text-main-dark self-center">{fullText || '· · ·'}</span>
            </div>

            {/* <div className="space-x-3 flex flex-row items-center justify-center mt-8">
              <ToggleSwitch checked={showLandmarks} setChecked={setShowLandmarks} />
              <span className="text-xl">Mostrar landmarks</span>
            </div> */}
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