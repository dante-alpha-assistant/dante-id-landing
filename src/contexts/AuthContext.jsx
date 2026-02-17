// Temporary — WP-1 will provide the real one
import { createContext, useContext } from 'react';
const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);
export default AuthContext;
