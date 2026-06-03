import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-caption font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl hairline-border bg-canvas text-text-primary text-body placeholder:text-text-secondary/60 focus-ring focus:border-accent/40 transition-colors ${error ? 'border-destructive/40' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-caption-sm text-destructive">{error}</p>}
    </div>
  )
})

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = '', id, ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-caption font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl hairline-border bg-canvas text-text-primary text-body placeholder:text-text-secondary/60 focus-ring focus:border-accent/40 transition-colors resize-y min-h-[80px] ${error ? 'border-destructive/40' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-caption-sm text-destructive">{error}</p>}
    </div>
  )
})
