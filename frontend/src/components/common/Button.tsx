import React from 'react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled = false,
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none transition-all duration-150 active:scale-95';

  const variants = {
    primary:
      'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/20 hover:shadow-purple-500/30',
    secondary:
      'bg-transparent border border-slate-600 hover:border-slate-500 hover:bg-slate-700/60 text-slate-200',
    text: 'bg-transparent hover:bg-slate-700/60 text-slate-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabledCls} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
