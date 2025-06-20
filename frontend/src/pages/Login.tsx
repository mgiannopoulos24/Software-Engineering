import boatLogo from '../assets/images/boat.png';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://195.168.1.5:8080/api/auth/login', {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      // Set token as default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/admin');
    } catch (error: any) {
      setError('Invalid credentials');
      setShowToast(true);
      console.error('Login failed:', error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="m-0 flex min-h-screen w-screen items-center justify-center bg-[#f8f9fa]">
      <div className="w-full max-w-[800px] px-4 sm:px-6 md:w-4/5 lg:w-3/4 xl:w-1/2">
        <div className="w-full rounded-[10px] bg-white p-[30px] shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
          <h2 className="mb-3 text-center text-2xl font-semibold text-gray-800">Welcome back</h2>

          <hr className="my-4 border-gray-200" />

          <div className="mb-6 flex justify-center">
            <img src={boatLogo} alt="Login Logo" className="mx-auto block w-[120px]" />
          </div>

          {showToast && (
            <div className="fixed right-4 top-4 z-50 flex w-72 items-center justify-between rounded bg-red-500 px-4 py-2 text-white shadow-lg">
              <div>
                <p className="font-bold">Error</p>
                <p className="text-sm">{error || 'Invalid credentials'}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-white hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showPassword ? (
                  <EyeOff
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            </div>

            <div className="mb-6 text-left">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-300 hover:bg-blue-700"
            >
              Log In
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
              <span>You don't have an account? </span>
              <Link to="/signup" className="text-blue-600 hover:text-blue-800">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
