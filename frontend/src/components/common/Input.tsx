import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: React.ReactNode;
  id?: string;
  name?: string;
  required?: boolean;
  accept?: string;
  autoComplete?: string;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  icon,
  id,
  name,
  required = false,
  accept,
  autoComplete,
}) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2
          text-slate-100 placeholder-slate-500 text-sm
          focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60
          transition-all duration-150
          ${icon ? 'pl-10' : 'pl-3'}
          ${className}
        `}
        id={id}
        name={name}
        required={required}
        accept={accept}
        autoComplete={autoComplete}
      />
    </div>
  );
};

export default Input;
