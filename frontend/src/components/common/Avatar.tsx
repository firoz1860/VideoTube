import React, { useEffect, useMemo, useState } from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src = '',
  alt = 'User avatar',
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = useMemo(() => {
    return (alt || 'User')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  }, [alt]);

  return (
    <div className={`rounded-full overflow-hidden bg-slate-700 flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {!hasError && src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setHasError(true)} />
      ) : (
        <span className="text-[10px] font-semibold text-white">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
