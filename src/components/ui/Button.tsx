import { clsx } from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            // Variants
            "text-white hover:opacity-90 focus:ring-[#c0483e]": variant === "primary",
            "bg-[#2c2824] text-[#e7e5e4] border border-[#3d3733] hover:bg-[#3d3733] focus:ring-[#78716c]": variant === "secondary",
            "text-[#a8a29e] hover:text-white hover:bg-white/[0.06] focus:ring-[#78716c]": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500": variant === "danger",
            // Sizes
            "text-sm px-3.5 py-1.5 gap-1.5": size === "sm",
            "text-sm px-5 py-2 gap-2": size === "md",
            "text-base px-6 py-2.5 gap-2": size === "lg",
          },
          className
        )}
        style={variant === "primary" ? { background: "#c0483e", ...props.style } : undefined}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
