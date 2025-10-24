import { AppLogo } from "@/utils/icons"

export default function Header() {
  return (
    <header className="border-b-[1px] border-main-dark/25 dark:border-main-light/25 h-12 md:h-16 lg:h-20 py-1 lg:py-2 lg:px-12 flex flex-row justify-center lg:justify-between bg-violet-dark">
      <AppLogo className="text-wisteria fill-wisteria h-10 md:h-14 lg:h-16"/>
    </header>
  )
}