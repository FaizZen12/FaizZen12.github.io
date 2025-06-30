import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: User }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 relative z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-serif font-bold text-gray-900">
              boksu.ai
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {currentUser ? (
                // Authenticated navigation
                <div className="flex space-x-8">
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      className={`
                        flex items-center space-x-1 text-sm transition-colors
                        ${location.pathname === path 
                          ? 'text-gray-900 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 font-medium'
                        }
                      `}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                // Unauthenticated navigation
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link to="/login">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {currentUser ? (
                // Authenticated mobile navigation
                <>
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={closeMobileMenu}
                      className={`
                        flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors
                        ${location.pathname === path 
                          ? 'bg-gray-100 text-gray-900 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span className="text-base">{label}</span>
                    </Link>
                  ))}
                </>
              ) : (
                // Unauthenticated mobile navigation
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block px-3 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      className="w-full bg-gray-900 text-white hover:bg-gray-800 py-3 text-base"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};