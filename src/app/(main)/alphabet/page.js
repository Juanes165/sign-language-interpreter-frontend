'use client';
import { useEffect, useRef, useState } from "react";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
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

  const [fullText, setFullText] = useState([]);
  const fullTextRef = useRef(fullText);

  const [wordSuggestions, setWordSuggestions] = useState(['', '', '']);


  useEffect(() => {
    showLandmarksRef.current = showLandmarks;
    fullTextRef.current = fullText;
  }, [showLandmarks, fullText]);


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

      let canvas;
      let ctx;

      setInterval(() => {
        const video = videoRef.current;

        try {
          canvas = canvasRef.current;
          ctx = canvas.getContext('2d');
        }
        catch {
          console.error("No se pudo inicializar el canvas")
        }

        if (video && video.readyState >= 2) {
          const detections = gestureRecognizer.recognizeForVideo(video, performance.now());

          // Drawing the landmarks
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (detections.landmarks && showLandmarksRef.current && canvas) {
            drawLandmarks(detections.landmarks);
          }

          if (!detections.handednesses.length) {

            if (currentWordLetters.length) {
              const currentWord = currentWordLetters.map((curretSign) => labels_dict[curretSign]).join("")

              fetch("api/spelling", {
                method: "POST",
                body: JSON.stringify(
                  {
                    word: currentWord,
                    context: fullTextRef.current.at(-1) || ''
                  }),
                headers: {
                  "Content-Type": "application/json",
                }
              }).then((res) => res.json())
                .then((response) => {
                  setCurrentWord(response.corrected);
                  setFullText(prevFullText => [...prevFullText, response.corrected])
                  setWordSuggestions([
                    currentWord,
                    ...response.suggestions.filter(item => item != currentWord).slice(0, 2)
                  ])
                })
                .catch((error) => {
                  console.error("Error al cargar corrección", error)
                  setFullText(prevFullText => [...prevFullText, currentWord])
                });
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
        const video = videoRef.current;
        video.srcObject.getTracks().forEach(track => track.stop());
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

  const updateWordWithSuggestion = (word) => {
    setFullText(prev => [...prev.slice(0, -1), word])
  }

  const clearText = () => {
    setFullText([]);
    setCurrentWord('');
    setWordSuggestions(['','','']);
  }

  return (
    <>
      <h1 className="text-amethyst text-2xl md:text-4xl text-center w-full font-semibold py-3 md:py-4">
        {"> Interpretador alfabético <"}
      </h1>
      <div className="px-12 md:px-20 pb-8 flex flex-col lg:flex-row space-x-10 justify-between">
        {/* {window.screen.width + 'x' + window.screen.height}
        {window.innerWidth + 'x' + window.innerHeight} */}

        {/* CAMERA */}
        <section ref={containerRef} className="w-full aspect-[3/4] md:aspect-[4/3] xl:aspect-[16/9] xl:w-[740px] 2xl:w-[970px] relative bg-main-dark dark:bg-main-light/5 rounded-3xl md:rounded-4xl shadow-md/50 dark:shadow-sm dark:shadow-main-light">
          {loadingWebcam && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  text-platinum flex flex-col items-center">
              <CameraIcon className="text-platinum w-40 h-40" />
              <span className="text-3xl text-center font-semibold">Cargando tu cámara</span>
            </div>
          )}
          <video
            className={`${loadingWebcam ? 'hidden' : 'block'} scale-x-[-1] absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover rounded-3xl md:rounded-4xl`}
            ref={videoRef}
            autoPlay
            playsInline
          />
          <canvas className={`${loadingWebcam ? 'hidden' : 'block'} absolute top-0 left-0 w-full h-full z-1 rounded-3xl md:rounded-4xl bg-transparent`} ref={canvasRef}></canvas>


          {/* BUTTON TO SHOW LANDMARKS */}
          <div className="w-16 h-16 bg-wisteria hover:bg-amethyst dark:bg-amethyst dark:hover:bg-grape rounded-full absolute bottom-2 right-2 lg:bottom-5 lg:right-5 cursor-pointer shadow-sm z-2">
            <button className="relative w-full h-full cursor-pointer" type="button" onClick={() => setShowLandmarks(!showLandmarks)}>
              <LandmarksLogo className="w-14 h-14 rotate-12 text-main-light absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <LandmarksPointsLogo className="w-14 h-14 rotate-12 text-grape dark:text-violet-dark absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </button>
          </div>


          {/* little header with predicted letter, MOBILE ONLY */}
          {!loadingWebcam &&
            <div className="absolute top-0 w-full h-20 p-3 md:px-40 z-2 lg:hidden">
              <div className="w-full h-full bg-main-light/70 dark:bg-main-dark/35 backdrop-blur-sm rounded-2xl flex px-8 items-center justify-center">
                <HandIcon width="56" height="56" className="text-amethyst dark:text-grape" />
                <div className="w-20 ml-2 flex justify-center">
                  <span className="text-5xl font-semibold text-amethyst dark:text-grape">{curretSign.toUpperCase() || '—'}</span>
                </div>
                <div className="w-24 flex justify-end">
                  <span className="text-4xl font-semibold text-wisteria dark:text-amethyst self-center">{Math.trunc(currentSignScore * 100) + "%" || '-'}</span>
                </div>
              </div>
            </div>
          }

        </section>


        {/* RIGHT DIV, WORDS AND PREDICTIONS */}
        <section className="flex flex-col w-full pt-4 lg:max-w-80 2xl:max-w-96 justify-center items-center self-center">

          {/* SHOWING THE PREDICTIONS */}
          <div className="hidden lg:flex px-4 space-x-2 items-center justify-between">
            <HandIcon width="72" height="72" className="text-amethyst dark:text-wisteria" />
            <div className="w-20 flex justify-center">
              <span className="text-7xl font-semibold text-amethyst dark:text-wisteria">{curretSign.toUpperCase() || '—'}</span>
            </div>
            <div className="w-32 flex justify-end">
              <span className="text-5xl font-semibold text-wisteria dark:text-amethyst self-center">{Math.trunc(currentSignScore * 100) + "%" || '-'}</span>
            </div>
          </div>

          {/* LETTERS AND TEXT AREA */}
          <div className="lg:mt-10 w-full">
            <div className="flex flex-col justify-center">

              <span
                className="w-auto min-w-60 text-3xl text-center py-2 rounded-md cursor-pointer bg-wisteria/25 hover:bg-wisteria/40 dark:bg-amethyst/75 dark:hover:bg-amethyst/90 truncate shadow-sm"
                onClick={() => updateWordWithSuggestion(currentWord)}
              >
                {currentWord || '—'}
              </span>

              <div className="flex flex-row bg-platinum/25 dark:bg-platinum/10 mx-1.5 rounded-b-lg shadow-md overflow-hidden">
                {wordSuggestions.map((word, index) => (
                  <span
                    key={index}
                    style={{ direction: 'rtl' }}
                    className={`flex-1 h-12 text-base xs:text-lg text-center overflow-hidden whitespace-nowrap 
                      py-2 px-2 cursor-pointer hover:bg-platinum dark:hover:bg-main-light/15 transition-colors duration-200
                      ${index && 'border-platinum border-l'}`}
                    onClick={() => updateWordWithSuggestion(word)}
                  >
                    {word || ' '}
                  </span>
                ))}
              </div>
            </div>
            <div
              className="mt-5 py-4 px-8 text-center cursor-pointer border-2 border-platinum border-dashed rounded-lg dotted bg-platinum/25 dark:bg-platinum/10"
              onClick={clearText}
            >
              <span className="text-xl self-center">{fullText.join(" ") || '· · ·'}</span>
            </div>

          </div>

        </section>

      </div>

    </>
  )
}


const labels_dict = {
  "0": "a", "1": "b", "2": "c", "3": "d", "4": "e", "5": "f", "6": "g", "7": "h", "8": "i",
  "9": "j", "10": "k", "11": "l", "12": "m", "13": "n", "14": "ñ", "15": "o", "16": "p",
  "17": "q", "18": "r", "19": "s", "20": "t", "21": "u", "22": "v", "23": "w", "24": "x",
  "25": "y", "26": "z", "": ""
};