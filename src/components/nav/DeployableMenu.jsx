'use client';
import useClickOutside from "@/hooks/useClickOutside";
import { useState } from "react";

export default function DeployableMenu({ children, trigger}) {
  const [show, setShow] = useState(false);
  const dropRef = useClickOutside(() => setShow(false));

  return (
    <div className="w-fit relative z-10" ref={dropRef} onClick={() => setShow(prev => !prev)}>
      <div>{trigger}</div>
      {show &&
        <ul className="min-w-max absolute right-0 mt-2 bg-main-light dark:bg-main-dark divide-y divide-platinum rounded-lg shadow overflow-hidden dark:shadow-platinum">
          {children}
        </ul>
      }
    </div>
  )
}

export function DeployableMenuItem({ children }) {
  return (
    <li className="flex gap-3 items-center px-4 py-2 hover:bg-platinum dark:hover:bg-main-light/15 cursor-pointer">
      {children}
    </li>
  )
}