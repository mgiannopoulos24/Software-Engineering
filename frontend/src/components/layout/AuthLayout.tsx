import boatLogo from '@/assets/images/boat.png';
import React from 'react';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children, footer }) => {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img src={boatLogo} alt="AIS Service Logo" className="w-24" />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-xl sm:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>

          {children}

          <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
