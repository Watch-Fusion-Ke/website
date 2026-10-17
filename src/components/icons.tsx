// Simple outline icons, drawn as SVG so they look the same on every phone.
type IconProps = { className?: string };

const Icon = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
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
