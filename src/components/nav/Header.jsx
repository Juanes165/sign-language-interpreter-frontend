'use client';

import Link from "next/link"
import { AppLogo } from "@/utils/icons"
import { SunIcon, MoonIcon } from "@/utils/icons";

export default function Header() {

  const handleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark")

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <header className="border-main-dark/25 dark:border-main-light/25 h-16 py-1 px-6 flex flex-row justify-between items-center bg-violet-dark dark:bg-main-dark">
      <AppLogo className="text-wisteria fill-wisteria h-10 md:h-14 lg:h-16" />
      <button onClick={handleDarkMode} className="cursor-pointer">

        <nav className="flex gap-6">
          <Link
            href="/alphabet"
            className="text-platinum hover:text-amethyst transition-colors font-semibold text-lg"
          >
            Alfabeto
          </Link>
          <Link
            href="/gestures"
            className="text-platinum hover:text-amethyst transition-colors font-semibold text-lg"
          >
            Gestos Dinámicos
          </Link>
        </nav>

        <div className="lg:hidden w-8 md:w-12" />

        <SunIcon className='block dark:hidden w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-wisteria' />
        <MoonIcon className='hidden dark:block w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-wisteria' />
      </button>
    </header>
  )
}