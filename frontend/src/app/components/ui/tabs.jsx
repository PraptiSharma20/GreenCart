import React, { createContext, useContext, useState } from "react";
import clsx from "clsx";

const TabsContext = createContext(null);

export function Tabs({ defaultValue, className, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={clsx("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={clsx("mb-4 flex gap-2 border-b", className)}>{children}</div>
  );
}

export function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      className={clsx(
        "px-4 py-2 text-sm",
        active ? "border-b-2 border-green-600 text-green-700" : "text-gray-600",
        className
      )}
      onClick={() => ctx?.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={clsx(className)}>{children}</div>;
}
