import { useState, useRef } from 'react';

export default function NumberInput({ initialValue = 2, step = 1, min = 2, max = 4, disabled }) {
const inputRef = useRef(null);

  const increment = () => {
    if (inputRef.current) {
      inputRef.current.stepUp();
    }
  };

  const decrement = () => {
    if (inputRef.current) {
      inputRef.current.stepDown();
    }
  };

  return (
    <div className="flex items-center bg-platinum rounded-lg">
      {/* Input de número sin spinners */}
      <input
        ref={inputRef}
        type="number"
        defaultValue={initialValue}
        min={min}
        max={max}
        step={step}
        className="text-center py-1 px-1
          appearance-none
          [&::-webkit-inner-spin-button]:appearance-none 
          [&::-webkit-outer-spin-button]:appearance-none 
          [-moz-appearance:textfield]"
        disabled
      />

      {/* Botones verticales */}
      <div className="flex flex-col rounded-lg overflow-hidden">
        <button
          onClick={increment}
          className="flex items-center justify-center pt-0.5 px-1 text-sm"
        >
          ▲
        </button>
        <button
          onClick={decrement}
          className="flex items-center justify-center pb-0.5 px-1 text-sm"
        >
          ▼
        </button>
      </div>
    </div>
  );
};
