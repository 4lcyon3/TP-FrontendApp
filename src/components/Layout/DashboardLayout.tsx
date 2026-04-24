import React from 'react';
import { Navbar } from './Navbar';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   return (
     <div>
       <Navbar />
       <main>{children}</main>
     </div>
   )
}