import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import boatLogo from '../assets/images/boat.png';

interface Country {
  name: {
    common: string;
  };
  cca2: string;
}

const Signup: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isCountryOpen, setIsCountryOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        const data: Country[] = await response.json();
        setCountries(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isCountryOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCountryOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your signup logic here
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const filteredCountries = countries
    .sort((a, b) => a.name.common.localeCompare(b.name.common))
    .filter((c) => c.name.common.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
    if (/[a-z]/.test(password)) strength += 1; // Has lowercase
    if (/[0-9]/.test(password)) strength += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char

    return strength;
  };

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f8f9fa] w-screen m-0">
      <div className="signup-container text-center w-full max-w-[800px] p-[30px] bg-white rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
        {/* Initial signup view */}
        {!showForm ? (
          <div id="initial-view">
            <h2 className="mb-3 text-2xl font-semibold text-gray-800">Create your Account</h2>
            <hr className="my-4 border-gray-200" />
            <img src={boatLogo} alt="Signup Logo" className="signup-logo mb-4 w-[120px] mx-auto block" />
            <div className="mb-4">
              <button
                type="button"
                id="show-form-btn"
                className="btn btn-primary w-full mb-3 py-2 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300"
                onClick={handleShowForm}
              >
                Create account with email
                <br />
                or
                <br />
                with phone number
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <span>Already have an account? </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-800">
                Log in
              </Link>
            </div>
            <hr className="mt-4 border-gray-200" />
          </div>
        ) : (
          /* Signup form (hidden by default) */
          <div id="signup-form">
            <h2 className="mb-3 text-2xl font-semibold text-gray-800">Create your Account</h2>
            <hr className="my-4 border-gray-200" />
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label htmlFor="emailOrPhone" className="form-label block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone number
                </label>
                <input
                  type="text"
                  className="form-control w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="emailOrPhone"
                  placeholder="Enter your email or phone number"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />
              </div>
              <div className="mb-3 text-start">
                <label htmlFor="firstName" className="form-label block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  className="form-control w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="firstName"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="mb-3 text-start">
                <label htmlFor="lastName" className="form-label block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  className="form-control w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="lastName"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="mb-3 text-start">
                <label htmlFor="country" className="form-label block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <div ref={countryDropdownRef} className="relative">
                  <div
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex justify-between items-center"
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                  >
                    <span>
                      {country
                        ? countries.find((c) => c.cca2 === country)?.name.common || 'Select your country'
                        : 'Select your country'}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {isCountryOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base overflow-hidden focus:outline-none top-full">
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                        <input
                          ref={inputRef}
                          type="text"
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Search countries..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-60 overflow-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <div
                              key={c.cca2}
                              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                                country === c.cca2 ? 'bg-blue-100' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCountry(c.cca2);
                                setIsCountryOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              {c.name.common}
                            </div>
                          ))
                        ) : (
                          <div className="py-2 px-3 text-gray-500">No countries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4 text-start">
                <label htmlFor="password" className="form-label block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    className="form-control w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute right-2 top-3 group">
                    <div className="text-gray-500 cursor">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="absolute hidden group-hover:block right-0 w-64 p-2 bg-gray-800 text-white text-sm rounded-md z-10">
                      Password should be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
                    </div>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        passwordStrength === 0 ? 'w-0' : 
                        passwordStrength === 1 ? 'w-1/5 bg-red-500' : 
                        passwordStrength === 2 ? 'w-2/5 bg-orange-500' : 
                        passwordStrength === 3 ? 'w-3/5 bg-yellow-500' : 
                        passwordStrength === 4 ? 'w-4/5 bg-blue-500' : 
                        'w-full bg-green-500'
                      } transition-all duration-300`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {passwordStrength === 0 && "Enter a password"}
                    {passwordStrength === 1 && "Very weak"}
                    {passwordStrength === 2 && "Weak"}
                    {passwordStrength === 3 && "Medium"}
                    {passwordStrength === 4 && "Strong"}
                    {passwordStrength === 5 && "Very strong"}
                  </p>
                </div>
              </div>
              <div className="text-center mb-4">
                <img src={boatLogo} alt="Small Logo" className="small-logo w-[80px] mx-auto" />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full mb-3 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300"
              >
                Create your account
              </button>
              <div className="text-center">
                <button
                  type="button"
                  id="cancel-btn"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;