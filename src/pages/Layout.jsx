import { Outlet } from 'react-router-dom';
import { BackToTopButton } from '../components/BackToTopButton';

/**
 * Layout wrapper component that includes BackToTopButton
 * Use this to wrap authenticated pages that need the scroll-to-top functionality
 */
export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-md-background">
      {children || <Outlet />}
      <BackToTopButton />
    </div>
  );
};

export default Layout;