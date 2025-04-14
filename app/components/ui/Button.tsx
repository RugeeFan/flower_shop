interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  leftIcon,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm md:text-base disabled:opacity-50";

  const variants = {
    primary: "bg-primary text-white hover:bg-opacity-90",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-gray-600 hover:bg-gray-100"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {leftIcon && <span className="text-xl">{leftIcon}</span>}
      {children}
    </button>
  );
}