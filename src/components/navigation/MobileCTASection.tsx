import { Link } from 'react-router-dom';
import { CTAButton } from '../../types/navigation';

interface MobileCTASectionProps {
  ctaButtons: CTAButton[];
  onButtonClick: () => void;
}

const MobileCTASection = ({ ctaButtons, onButtonClick }: MobileCTASectionProps) => {
  return (
    <div className="space-y-3">
      {ctaButtons.map((button) => (
        <Link
          key={button.id}
          to={button.href}
          onClick={onButtonClick}
          className={`block w-full py-3 px-4 text-center font-medium rounded-lg transition-colors min-h-[44px] ${
            button.variant === 'primary'
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-white text-brand-600 border border-brand-600 hover:bg-brand-50'
          }`}
        >
          {button.label}
        </Link>
      ))}
    </div>
  );
};

export default MobileCTASection;