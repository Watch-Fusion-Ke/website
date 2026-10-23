// Simple outline icons, drawn as SVG so they look the same on every phone.
type IconProps = { className?: string };

const Icon = ({ className, children, strokeWidth = 1.75 }: IconProps & { children: React.ReactNode; strokeWidth?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const MailIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

export const PhoneIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

export const MapPinIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

export const ChatIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Icon>
);

export const ClockIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);

export const SunIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Icon>
);

export const MoonIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

export const HomeIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

// A wrist watch with a square face, for the gents' category.
export const WatchSquareIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
    <path d="M8.5 6V3h7v3M8.5 18v3h7v-3" />
    <path d="M12 9.5V12l1.8 1.2" />
  </Icon>
);

// A wrist watch with a round face, for the ladies' category.
export const WatchRoundIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M9 7V3h6v4M9 17v4h6v-4" />
    <path d="M12 9.5V12l1.8 1.2" />
  </Icon>
);

export const BagIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Icon>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const CloseIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const EyeIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const EyeOffIcon = ({ className }: IconProps) => (
  <Icon className={className}>
    <path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </Icon>
);

// Finer icons for the phone tab bar: thin lines, with a crown and a strap on the watches.
export const TabHomeIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={1.5}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Icon>
);

export const TabShopIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={1.5}>
    <path d="M4 10V20h16V10M3 9l2-5h14l2 5-1.5 2a2 2 0 0 1-3.2 0 2 2 0 0 1-3.2 0 2 2 0 0 1-3.2 0 2 2 0 0 1-3.2 0A2 2 0 0 1 3 9Z" />
    <path d="M9 20v-6h6v6" />
  </Icon>
);

export const TabSearchIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={1.5}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Icon>
);

export const TabGentsIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={1.5}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
    <path d="M9 6.5 9.8 3h4.4L15 6.5M9 17.5l.8 3.5h4.4l.8-3.5" />
    <path d="M17.5 11.2h1.2v1.6h-1.2M12 9.4V12l2 1.2" />
  </Icon>
);

export const TabLadiesIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={1.5}>
    <circle cx="12" cy="12" r="5" />
    <path d="M9.2 7.3 9.8 3h4.4l.6 4.3M9.2 16.7l.6 4.3h4.4l.6-4.3" />
    <path d="M12 9.6V12l1.8 1.1M12 6.9v.01" />
  </Icon>
);

export const TabBagIcon = ({ className }: IconProps) => (
  <Icon className={className} strokeWidth={1.5}>
    <path d="M5.5 8h13l-1 12h-11z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Icon>
);

export const WhatsAppIcon = ({ className }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
