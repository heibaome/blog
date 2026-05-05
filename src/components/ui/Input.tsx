import { clsx } from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-sans font-medium text-ink-light"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-3 py-2 rounded-lg border bg-paper text-ink font-sans text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-ink-lighter",
            error ? "border-red-400" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-sans font-medium text-ink-light"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-3 py-2 rounded-lg border bg-paper text-ink font-sans text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-ink-lighter resize-y min-h-[80px]",
            error ? "border-red-400" : "border-border",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
