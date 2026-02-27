import { supabase } from '../lib/supabase';

interface ThemePreference {
  theme: 'light' | 'dark';
  auto_detect: boolean;
  transition_enabled: boolean;
}

interface ThemeConfiguration {
  theme_name: string;
  css_variables: Record<string, string>;
  is_active: boolean;
}

export class ThemeApiService {
  static async getThemeConfig(): Promise<{ themes: string[], css_variables: any, default_theme: string }> {
    try {
      const { data, error } = await supabase
        .from('theme_configurations')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const themes = data?.map(config => config.theme_name) || ['light', 'dark'];
      const css_variables = data?.reduce((acc: any, config) => {
        acc[config.theme_name] = config.css_variables;
        return acc;
      }, {}) || {
        light: {
          '--text-color': '#333333',
          '--primary-color': '#007bff',
          '--background-color': '#ffffff'
        },
        dark: {
          '--text-color': '#ffffff',
          '--primary-color': '#4dabf7',
          '--background-color': '#1a1a1a'
        }
      };
      
      return {
        themes,
        css_variables,
        default_theme: 'light'
      };
    } catch (error) {
      console.error('Error fetching theme config:', error);
      // Return default configuration on error
      return {
        themes: ['light', 'dark'],
        css_variables: {
          light: {
            '--text-color': '#333333',
            '--primary-color': '#007bff',
            '--background-color': '#ffffff'
          },
          dark: {
            '--text-color': '#ffffff',
            '--primary-color': '#4dabf7',
            '--background-color': '#1a1a1a'
          }
        },
        default_theme: 'light'
      };
    }
  }
  
  static async saveThemePreference(preference: ThemePreference): Promise<{ success: boolean, updated_at: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('theme_preferences')
        .upsert({
          user_id: user.id,
          theme: preference.theme,
          auto_detect: preference.auto_detect,
          transition_enabled: preference.transition_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      
      return {
        success: true,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error saving theme preference:', error);
      return {
        success: false,
        updated_at: new Date().toISOString()
      };
    }
  }
  
  static async getThemePreference(): Promise<ThemePreference | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('theme_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No preference found, return null
          return null;
        }
        throw error;
      }
      
      return {
        theme: data.theme,
        auto_detect: data.auto_detect,
        transition_enabled: data.transition_enabled
      };
    } catch (error) {
      console.error('Error fetching theme preference:', error);
      return null;
    }
  }
  
  static async getComponentThemeVariants(): Promise<{ components: Record<string, Record<string, string>> }> {
    try {
      const { data, error } = await supabase
        .from('component_theme_variants')
        .select('*');
      
      if (error) throw error;
      
      const components = data?.reduce((acc: any, variant) => {
        if (!acc[variant.component_name]) {
          acc[variant.component_name] = {};
        }
        acc[variant.component_name][variant.theme_name] = variant.css_classes;
        return acc;
      }, {}) || {
        card: {
          dark: 'card-dark',
          light: 'card-light'
        },
        button: {
          dark: 'btn-dark',
          light: 'btn-light'
        }
      };
      
      return { components };
    } catch (error) {
      console.error('Error fetching component variants:', error);
      return {
        components: {
          card: {
            dark: 'card-dark',
            light: 'card-light'
          },
          button: {
            dark: 'btn-dark',
            light: 'btn-light'
          }
        }
      };
    }
  }
}