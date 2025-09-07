import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AVAX Subnet Dashboard',
  description: 'A dashboard for managing and interacting with AVAX subnets and blockchains.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>AVAX Subnet Dashboard</h1>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; {new Date().getFullYear()} AVAX Subnet Project</p>
        </footer>
      </body>
    </html>
  );
};

export default RootLayout;