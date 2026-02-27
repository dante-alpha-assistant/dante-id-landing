export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  order_index: number;
  is_active: boolean;
}

export interface CTAButton {
  id: string;
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  order_index: number;
  is_active: boolean;
}

export interface NavigationData {
  menuItems: NavigationItem[];
  ctaButtons: CTAButton[];
}