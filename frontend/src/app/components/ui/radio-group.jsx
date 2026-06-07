import React, { createContext, useContext, useId, useState } from "react";
import clsx from "clsx";

const RadioContext = createContext(null);

export function RadioGroup({
  value,
  defaultValue = "",
  onValueChange,
  name,
  className,
  children,
}) {
  const autoName = useId();
  const groupName = name || autoName;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : internalValue;

  const set = (next) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <RadioContext.Provider value={{ value: selected, set, name: groupName }}>
      <div role="radiogroup" className={clsx(className)}>{children}</div>
    </RadioContext.Provider>
  );
}

export function RadioGroupItem({ value, id, className, disabled, children }) {
  const ctx = useContext(RadioContext);
  if (!ctx) {
    throw new Error("RadioGroupItem must be used within RadioGroup");
  }

  const checked = ctx.value === value;

  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="radio"
          id={id}
          name={ctx.name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => ctx.set(value)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-150",
            checked
              ? "border-green-600 bg-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.2)] dark:border-green-500 dark:bg-green-500"
              : "border-gray-300 bg-white dark:border-gray-500 dark:bg-gray-800"
          )}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
      </span>
      {children}
    </span>
  );
}
