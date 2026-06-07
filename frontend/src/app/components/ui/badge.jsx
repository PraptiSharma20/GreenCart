import clsx from "clsx";
import React from "react";

export function Badge({ className, children, ...props }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
