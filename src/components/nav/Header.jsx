'use client';

import DeployableMenu, { DeployableMenuItem } from "./DeployableMenu";
import { AppLogo } from "@/utils/icons"
import { SunIcon, MoonIcon, HandsIcon, LetterIcon } from "@/utils/icons";

export default function Header() {

  const handleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark")

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <header className="border-b-[1px] dark:border-main-light/25 h-12 md:h-16 py-1 px-4 lg:px-12 flex flex-row justify-between bg-violet-dark items-center">
      <div className="lg:hidden w-8 md:w-12" />
      <AppLogo className="text-wisteria fill-wisteria h-10 md:h-14" />

      <DeployableMenu trigger={
        <button className="flex flex-col space-y-1.5 cursor-pointer">
          <span className="grow h-1.5 w-10 block rounded-full bg-wisteria"></span>
          <span className="grow h-1.5 w-10 block rounded-full bg-wisteria"></span>
          <span className="grow h-1.5 w-10 block rounded-full bg-wisteria"></span>
        </button>
      }>

        <DeployableMenuItem >
          <LetterIcon className=" w-8 h-8 text-wisteria" />
          <a href="/alphabet"className="text-lg">
            Interpretador alfabético
          </a>
        </DeployableMenuItem>

        <DeployableMenuItem >
          <HandsIcon className=" w-8 h-8 text-wisteria" />
          <a href="/gestures" className="text-lg">
            Reconocimiento de señas
          </a>
        </DeployableMenuItem>

        <DeployableMenuItem >
          <button onClick={handleDarkMode} className="cursor-pointer w-full flex items-center space-x-3">
            <SunIcon className='block dark:hidden w-8 h-8 text-wisteria' />
            <MoonIcon className='hidden dark:block w-8 h-8 text-wisteria' />
            <span className="block dark:hidden text-lg">Modo oscuro</span>
            <span className="hidden dark:block text-lg">Modo claro</span>
          </button>
        </DeployableMenuItem>
      </DeployableMenu>


      {/* <nav className="flex gap-6">
        <a
          href="/alphabet"
          className="text-platinum hover:text-amethyst transition-colors font-semibold text-lg"
        >
          Alfabeto
        </a>
        <a
          href="/gestures"
          className="text-platinum hover:text-amethyst transition-colors font-semibold text-lg"
        >
          Gestos Dinámicos
        </a>
      </nav> */}
    </header>
  )
}