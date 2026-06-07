import React from "react";
import clsx from "clsx";

export function Label({ className, ...props }) {
  return (
    <label
      className={clsx("text-sm font-medium text-gray-700 dark:text-gray-200", className)}
      {...props}
    />
  );
}
