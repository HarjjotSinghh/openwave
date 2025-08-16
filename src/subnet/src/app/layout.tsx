import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Avalanche Subnet Dashboard',
  description: 'A dashboard for managing and interacting with Avalanche subnets and blockchains.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>Avalanche Subnet Dashboard</h1>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; {new Date().getFullYear()} Avalanche Subnet Project</p>
        </footer>
      </body>
    </html>
  );
};

export default RootLayout;