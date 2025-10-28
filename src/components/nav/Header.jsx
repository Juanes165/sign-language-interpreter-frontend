'use client';
import { AppLogo } from "@/utils/icons"
import { SunIcon, MoonIcon } from "@/utils/icons";
import { useEffect } from "react";

export default function Header() {

  const handleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark")

    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <header className="border-b-[1px] dark:border-main-light/25 h-12 md:h-16 lg:h-20 py-1 lg:py-2 px-4 lg:px-12 flex flex-row justify-between bg-violet-dark">
      <div className="lg:hidden w-8 md:w-12" />
      <AppLogo className="text-wisteria fill-wisteria h-10 md:h-14 lg:h-16" />
      <button onClick={handleDarkMode} className="cursor-pointer">
        <SunIcon className='block dark:hidden w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-wisteria' />
        <MoonIcon className='hidden dark:block w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-wisteria' />
      </button>
    </header>
  )
}