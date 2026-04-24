import { Video } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 p-1">
        <Video className="h-5 w-5 text-white" />
      </div>
      <span className="ml-2 font-bold text-white">VidTube</span>
    </div>
  );
};

export default Logo;