import { useState } from "react";

export default function ToggleSwitch({ checked, setChecked }) {

  const toggle = () => setChecked(!checked);

  return (
    <label className="relative inline-block w-[50px] h-[30px] cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        className="sr-only"
      />
      <span
        className={`
          block w-full h-full rounded-full
          transition-colors duration-200 ease-in
          ${checked ? "bg-amethyst" : "bg-platinum"}
        `}
      >
        <span
          className={`
            block absolute top-[2px] left-[2px]
            w-[26px] h-[26px] bg-main-light rounded-full
            transition-all duration-200 ease-in
            ${checked ? "left-[22]" : "left-[2.5px]"}
          `}
        />
      </span>
    </label>
  );
}
