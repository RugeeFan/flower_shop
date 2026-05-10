interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  children,
  leftIcon,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-6 py-3 text-[12px] font-medium uppercase tracking-eyebrow transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40";

  const variants = {
    primary: "bg-charcoal text-bone hover:bg-terracotta",
    outline: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-bone",
    ghost: "text-charcoal hover:text-terracotta",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {leftIcon && <span className="text-base">{leftIcon}</span>}
      {children}
    </button>
  );
}
