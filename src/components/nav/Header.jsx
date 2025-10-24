import Link from "next/link"
import { AppLogo } from "@/utils/icons"

export default function Header() {
  return (
    <header className="border-b-[1px] border-main-dark/25 dark:border-main-light/25 h-16 py-1 px-6 flex flex-row justify-between items-center bg-violet-dark dark:bg-main-dark">
      <AppLogo className="text-wisteria fill-wisteria h-14"/>
      
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
    </header>
  )
}