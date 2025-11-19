import React from 'react';

export const Layout = ({ children }) => {
  return (
    <div className="container">
      <header className="header">
        <h1>Pronto</h1>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};
