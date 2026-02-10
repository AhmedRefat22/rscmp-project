import { GraduationCap } from 'lucide-react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
    const sizes = {
        sm: { icon: 'w-6 h-6', text: 'text-base', container: 'gap-2' },
        md: { icon: 'w-8 h-8', text: 'text-xl', container: 'gap-2.5' },
        lg: { icon: 'w-12 h-12', text: 'text-3xl', container: 'gap-3' },
    };

    const currentSize = sizes[size];

    return (
        <div className={`flex items-center ${currentSize.container} ${className}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-2 shadow-lg">
                    <GraduationCap className={`${currentSize.icon} text-white`} strokeWidth={2.5} />
                </div>
            </div>
            {showText && (
                <div className="flex flex-col leading-none">
                    <span className={`${currentSize.text} font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent`}>
                        RSCMP
                    </span>
                    <span className="text-xs text-secondary-600 dark:text-secondary-400 font-medium">
                        Research System
                    </span>
                </div>
            )}
        </div>
    );
}
