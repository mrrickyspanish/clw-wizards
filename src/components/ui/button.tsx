import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-heading font-bold uppercase tracking-wider ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-11 min-w-11 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-brand-orange text-brand-light hover:bg-brand-orange-dark",
        premium: "bg-brand-orange text-brand-light font-bold shadow-lg hover:bg-brand-orange-dark hover:shadow-xl hover:scale-105 transform",
        outline: "border-2 border-brand-navy text-brand-navy bg-transparent hover:bg-brand-navy hover:text-brand-light",
        secondary: "bg-brand-light text-brand-navy-secondary hover:bg-brand-beige",
        ghost: "hover:bg-brand-beige hover:text-brand-navy",
        link: "text-brand-orange underline-offset-4 hover:underline font-semibold",
        hero: "bg-brand-orange text-brand-light font-bold text-lg shadow-2xl hover:bg-brand-orange-dark hover:shadow-[0_12px_30px_hsl(var(--brand-orange)/0.35)] hover:scale-105 transform transition-all duration-500",
        navy: "bg-brand-navy text-brand-light hover:bg-brand-navy-secondary",
      },
      size: {
        default: "h-12 px-6 py-3",
        md: "h-11 rounded-lg px-5 text-sm",
        sm: "h-11 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-10 text-base",
        xl: "h-16 rounded-2xl px-12 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
