import { createContext } from 'react';

/** Tab screens share one bar owned by the navigator, rather than one per page. */
export const PublicTabContext = createContext(false);
