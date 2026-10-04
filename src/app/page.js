'use client';
import { BookIcon, HandIcon, QuestionIcon, PlayIcon } from "@/utils/icons";
import { useState } from "react";

export default function Home() {

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialData, setTutorialData] = useState({});

  const showTutorialPopUp = (data) => {
    setTutorialData(data);
    setShowTutorial(true);
  }

  return (
    <div className="container mx-auto flex flex-col min-h-screen">
      <main className="w-full flex grow flex-col items-center pt-4 lg:pt-8">
        <h1 className="text-3xl lg:text-5xl text-amethyst dark:text-grape text-balance text-center font-semibold">
          UNA VOZ PARA TUS MANOS
        </h1>

        <span className="lg:text-xl text-main-dark/30 dark:text-main-light/70 text-balance text-center italic px-8 mt-4">
          Más que una app, un puente para la comunidad
        </span>

        <section className="flex flex-col lg:flex-row w-[75%] md:w-[65%] mt-8 space-y-12 space-x-12">

          {/* IZQUIERDA, ALFABETO */}
          <div className="flex-1 w-full relative">
            <a href="/alphabet" className="inline-block w-full aspect-square rounded-2xl relative bg-amethyst hover:bg-wisteria dark:bg-grape dark:hover:bg-amethyst transition-colors duration-300 cursor-pointer">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4">
                <BookIcon className="w-24 h-24 md:w-30 md:h-30 self-center text-main-light" />
                <span className="text-4xl lg:text-5xl font-semibold text-main-light">Alfabeto</span>
              </div>
            </a>
            <div className="absolute flex space-x-2 top-0 right-0 mt-1 mr-1 xl:mt-2 xl:mr-2">
              <button type="button" onClick={() => showTutorialPopUp(alphabetTutorialData)} className="bg-main-light/25 hover:bg-main-light/50 transition-colors duration-200 cursor-pointer p-2 rounded-2xl">
                <QuestionIcon className="w-10 h-10 text-main-light" />
              </button>
              <a href="https://www.youtube.com/watch?v=Yrl7VQBBoIw" target="_blank" className="bg-main-light/25 hover:bg-main-light/50 transition-colors duration-200 cursor-pointer p-2 rounded-2xl">
                <PlayIcon className="w-10 h-10 text-main-light" />
              </a>
            </div>
          </div>

          {/* DERECHA, SEÑAS */}
          <div className="flex-1 w-full relative">
            <a href="/gestures" className="inline-block w-full aspect-square rounded-2xl relative bg-amethyst hover:bg-wisteria dark:bg-grape dark:hover:bg-amethyst transition-colors duration-300 cursor-pointer">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4">
                <HandIcon className="w-24 h-24 md:w-30 md:h-30 self-center text-main-light" />
                <span className="text-4xl lg:text-5xl font-semibold text-main-light">Señas</span>
              </div>
            </a>
            <div className="absolute flex space-x-2 top-0 right-0 mt-1 mr-1 xl:mt-2 xl:mr-2">
              <button type="button" onClick={() => showTutorialPopUp(signsTutorialData)} className="bg-main-light/25 hover:bg-main-light/50 transition-colors duration-200 cursor-pointer p-2 rounded-2xl">
                <QuestionIcon className="w-10 h-10 text-main-light" />
              </button>
              <a href="https://www.youtube.com/watch?v=C6ZxcfmUmjc" target="_blank" className="bg-main-light/25 hover:bg-main-light/50 transition-colors duration-200 cursor-pointer p-2 rounded-2xl">
                <PlayIcon className="w-10 h-10 text-main-light" />
              </a>
            </div>
          </div>

        </section>

      </main>
      <footer className="flex flex-col items-center justify-center pb-4 mt-16 lg:mt-8">
        <span className="text-sm text-center">
          Desarrollado con ❤️ por&nbsp;
          <span className="font-bold">Geider M. y Esteban B.</span>
        </span>
        <span className="text-xs text-center">
          Bajo la dirección de <span className="font-bold">Oscar Bedoya y Raúl Gutierrez</span>
        </span>
      </footer>

      {showTutorial &&
        <TutorialPopup tutorialData={tutorialData} setShow={setShowTutorial} />
      }

    </div>
  );
}

function TutorialPopup({ tutorialData, setShow }) {

  const {
    title,
    description
  } = tutorialData;

  return (
    <>
      <div className="absolute inset-0 bg-main-light/25 dark:bg-main-dark/30 backdrop-blur-lg z-10" />
      <div className="fixed inset-0 flex items-center justify-center z-20">

        <div className="relative p-8 mx-8 w-100 rounded-4xl bg-main-light dark:bg-main-dark border border-amethyst dark:border-grape z-15">
          <button type="button" onClick={() => setShow(false)} className="absolute top-0 right-0 h-6 w-6 mt-7 mr-7 flex items-center justify-center cursor-pointer">
            <span className="absolute w-6 h-0.5 rounded-full rotate-45 bg-main-dark/35" />
            <span className="absolute w-6 h-0.5 rounded-full -rotate-45 bg-main-dark/35" />
          </button>

          <h1 className="text-center text-2xl">{title}</h1>
          <p className="text-lg mt-4">{description}</p>
          <button type="button" onClick={() => setShow(false)} className="w-full px-4 py-2 text-main-light bg-amethyst dark:bg-grape rounded-lg mt-8 cursor-pointer">¡Entendido!</button>
        </div>
      </div>
    </>
  )
}


const alphabetTutorialData = {
  title: "Alfabeto",
  description: `Este módulo detecta e interpreta las 27 señas del alfabeto de la LSC, 
            aquí podrás deletrear palabras completas letra por letra.
            Si tienes algún error ¡No te preocupes! El corrector de texto te ayudará con la redacción.`
}

const signsTutorialData = {
  title: "Señas",
  description: `Este módulo reconoce e interpreta señas completas de la LSC (saludos, cortesía, colores,
  números y más), permitiéndote comunicar palabras y expresiones de forma natural. Podrás practicar
  la formación de frases y mejorar tu fluidez al expresarte con señas. 
  `
}