interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dim = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Exactly mirrors public/favicon.svg */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="vt-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill="url(#vt-logo-grad)" />
        <polygon points="11,8 11,24 25,16" fill="white" opacity="0.96" />
      </svg>

      <span className="font-bold text-white" style={{ fontSize: dim * 0.6 }}>
        VidTube
      </span>
    </div>
  );
};

export default Logo;
