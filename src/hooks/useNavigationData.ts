import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavigationData } from '../types/navigation';

const defaultNavigation: NavigationData = {
  menuItems: [
    { id: '1', label: 'How It Works', href: '/how-it-works', order_index: 1, is_active: true },
    { id: '2', label: 'Pricing', href: '/pricing', order_index: 2, is_active: true },
    { id: '3', label: 'Docs', href: '/docs', order_index: 3, is_active: true }
  ],
  ctaButtons: [
    { id: '1', label: 'Login', href: '/login', variant: 'secondary', order_index: 1, is_active: true },
    { id: '2', label: 'Sign Up', href: '/signup', variant: 'primary', order_index: 2, is_active: true }
  ]
};

export const useNavigationData = () => {
  const [data, setData] = useState<NavigationData>(defaultNavigation);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResult, ctaResult] = await Promise.all([
          supabase.from('navigation_items').select('*').eq('is_active', true).order('order_index'),
          supabase.from('cta_buttons').select('*').eq('is_active', true).order('order_index')
        ]);

        if (menuResult.data && ctaResult.data) {
          setData({
            menuItems: menuResult.data,
            ctaButtons: ctaResult.data
          });
        }
      } catch (error) {
        console.error('Failed to fetch navigation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
};