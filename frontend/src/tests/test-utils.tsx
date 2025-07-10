import { AuthProvider } from '@/contexts/AuthContext';
import { FleetProvider } from '@/contexts/FleetContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ZoneProvider } from '@/contexts/ZoneContext';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

// Ένας wrapper που περιλαμβάνει ΟΛΟΥΣ τους providers που χρειάζονται τα components μας
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <WebSocketProvider>
            <FleetProvider>
              <ZoneProvider>
                {children}
                <Toaster />
              </ZoneProvider>
            </FleetProvider>
          </WebSocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function που χρησιμοποιεί το wrapper μας
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Εξάγουμε ξανά τα πάντα από το @testing-library/react, αλλά αντικαθιστούμε το render με το δικό μας
export * from '@testing-library/react';
export { customRender as render };