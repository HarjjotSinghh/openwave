import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Flow Subnet Dashboard',
  description: 'A dashboard for managing and interacting with Flow subnets and blockchains.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>Flow Subnet Dashboard</h1>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; {new Date().getFullYear()} Flow Subnet Project</p>
        </footer>
      </body>
    </html>
  );
};

export default RootLayout;