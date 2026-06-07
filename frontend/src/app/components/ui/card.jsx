import clsx from "clsx";
import React from "react";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={clsx("p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={clsx("p-4 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
