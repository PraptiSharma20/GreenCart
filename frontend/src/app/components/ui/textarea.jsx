import React from "react";
import clsx from "clsx";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
        "placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600",
        "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
}
