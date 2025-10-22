import { AppLogo } from "@/utils/icons"

export default function Header() {
  return (
    <header className="border-b-[1px] border-main-dark/25 dark:border-main-light/25 h-16 py-1 px-6 flex flex-row justify-between bg-violet-dark dark:bg-main-dark">
      <AppLogo className="text-wisteria fill-wisteria h-14"/>
    </header>
  )
}