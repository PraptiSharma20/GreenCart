import clsx from "clsx";
import React from "react";

export function Button({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 dark:bg-green-600 dark:hover:bg-green-700",
    outline:
      "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700",
    secondary:
      "bg-white text-green-700 border border-green-600 hover:bg-green-50 focus:ring-green-600 dark:bg-gray-800 dark:text-green-400 dark:border-green-600 dark:hover:bg-gray-700",
  };
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
