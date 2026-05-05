import { clsx } from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "primary":
          return {
            style: {
              background: "linear-gradient(135deg, #c0483e 0%, #ef4444 100%)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
            }
          };
        case "secondary":
          return {
            style: undefined,
            className: "bg-[rgba(42,38,34,0.8)] text-[#e7e5e4] border border-[#302c28] hover:bg-[rgba(48,44,40,0.9)] focus:ring-[#78716c]"
          };
        case "ghost":
          return {
            style: undefined,
            className: "text-[#a8a29e] hover:text-white hover:bg-white/[0.06] focus:ring-[#78716c]"
          };
        case "danger":
          return {
            style: {
              background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
            },
            className: "text-white hover:opacity-90 focus:ring-red-500"
          };
        default:
          return { style: undefined, className: "" };
      }
    };

    const variantStyles = getVariantStyles();

    const sizeClasses = {
      "sm": "text-sm px-4 py-2 gap-2",
      "md": "text-sm px-6 py-3 gap-2",
      "lg": "text-base px-8 py-3.5 gap-2"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px]",
          variantStyles.className || "text-white hover:opacity-90 focus:ring-[#c0483e]",
          sizeClasses[size],
          className
        )}
        style={{
          ...variantStyles.style,
          ...props.style
        }}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
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
