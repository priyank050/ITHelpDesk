import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import { COMPANIES } from './lib/admin-config';
import { useLogoStorage } from './hooks/use-logo-storage';

interface CompanyLogoProps {
  company: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

const imgSizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
};

export function CompanyLogo({ 
  company,
  size = 'md', 
  showBadge = false,
  className 
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const { logos } = useLogoStorage();
  const companyData = COMPANIES[company];
  
  // Use uploaded logo if available, otherwise use default
  const logoUrl = logos[company] || companyData.logo;
  const hasCustomLogo = !!logos[company];
  
  return (
    <motion.div 
      className={cn('relative group', className)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Logo Container */}
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-xl shadow-lg flex items-center justify-center overflow-hidden',
          'border-2 border-white/20',
          hasCustomLogo ? 'bg-white' : '',
          'transition-shadow duration-300 group-hover:shadow-xl'
        )}
        style={{
          background: hasCustomLogo || !imageError 
            ? (hasCustomLogo ? 'white' : `linear-gradient(135deg, ${companyData.colors.from} 0%, ${companyData.colors.to} 100%)`)
            : `linear-gradient(135deg, ${companyData.colors.from} 0%, ${companyData.colors.to} 100%)`,
        }}
      >
        {!imageError ? (
          <img 
            src={logoUrl}
            alt={companyData.name}
            className={cn(imgSizes[size], 'object-contain')}
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback: Gradient with initials */
          <div 
            className={cn(
              'w-full h-full flex items-center justify-center',
            )}
            style={{
              background: `linear-gradient(135deg, ${companyData.colors.from} 0%, ${companyData.colors.to} 100%)`,
            }}
          >
            <span 
              className={cn(
                textSizes[size],
                'font-bold text-white relative z-10 tracking-tight'
              )}
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              {companyData.initials}
            </span>
          </div>
        )}
      </div>
      
      {/* Online Badge */}
      {showBadge && (
        <motion.div 
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-sidebar shadow-sm"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// Full company header with both logos
export function CompanyHeader() {
  const { logos, isLoading } = useLogoStorage();
  
  return (
    <motion.div 
      className="flex flex-col gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Primary Company */}
      <div className="flex items-center gap-2.5">
        <div 
          className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
          style={{
            background: logos.primary 
              ? 'white' 
              : `linear-gradient(135deg, ${COMPANIES.primary.colors.from} 0%, ${COMPANIES.primary.colors.to} 100%)`,
          }}
        >
          {!isLoading && logos.primary ? (
            <img src={logos.primary} alt={COMPANIES.primary.name} className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-white font-bold text-xs">{COMPANIES.primary.initials}</span>
          )}
        </div>
        <h2 className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          {COMPANIES.primary.name}
        </h2>
      </div>
      
      {/* Secondary Company */}
      <div className="flex items-center gap-2.5">
        <div 
          className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
          style={{
            background: logos.secondary 
              ? 'white' 
              : `linear-gradient(135deg, ${COMPANIES.secondary.colors.from} 0%, ${COMPANIES.secondary.colors.to} 100%)`,
          }}
        >
          {!isLoading && logos.secondary ? (
            <img src={logos.secondary} alt={COMPANIES.secondary.name} className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-white font-bold text-xs">{COMPANIES.secondary.initials}</span>
          )}
        </div>
        <h2 className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          {COMPANIES.secondary.name}
        </h2>
      </div>
    </motion.div>
  );
}
