export interface NavigationItem {
  href: string;
  label: string;
  active?: boolean;
}

export interface CTAButton {
  href: string;
  label: string;
  variant: 'primary' | 'secondary';
}

export interface NavigationConfig {
  logo: {
    alt: string;
    src: string;
    href: string;
    text: string;
  };
  menuItems: NavigationItem[];
  ctaButtons: CTAButton[];
}

export const navigationConfig: NavigationConfig = {
  logo: {
    alt: 'Navigation Bar Logo',
    src: '/logo.png',
    href: '/',
    text: 'Navigation Bar'
  },
  menuItems: [
    { href: '/', label: 'Home' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' }
  ],
  ctaButtons: [
    { href: '/login', label: 'Login', variant: 'secondary' },
    { href: '/signup', label: 'Sign Up', variant: 'primary' }
  ]
};