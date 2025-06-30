import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { User, Crown, Zap, Download, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';

interface UserProfile {
  email: string;
  tier: string;
  daily_generation_count: number;
  last_generation_date: string;
}

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout, idToken, currentUser } = useAuth();

  useEffect(() => {
    if (idToken) {
      fetchProfile();
    } else if (currentUser) {
      setProfile({
        email: currentUser.email || '',
        tier: 'free',
        daily_generation_count: 0,
        last_generation_date: ''
      });
      setLoading(false);
    }
  }, [idToken, currentUser]);

  const fetchProfile = async () => {
    if (!idToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/user/profile', {
        'Authorization': `Bearer ${idToken}`
      });
      setProfile(response);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (currentUser) {
        setProfile({
          email: currentUser.email || '',
          tier: 'free',
          daily_generation_count: 0,
          last_generation_date: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleUpgrade = () => {
    alert('Premium upgrade coming soon! Get unlimited generations, exclusive voices, and MP3 downloads.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <User className="text-gray-900 mr-3" size={32} />
            <h1 className="text-4xl font-serif font-bold text-gray-900">Profile</h1>
          </div>
          <p className="text-gray-600 text-lg">Manage your account and preferences</p>
        </div>

        {/* Single Column Layout */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          {profile && (
            <div className="space-y-8">
              {/* User Info */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="mr-2" size={24} />
                  Account Information
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 font-medium">{profile.email}</p>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Current Plan</label>
                    <div className="flex items-center">
                      {profile.tier === 'premium' ? (
                        <Crown className="text-gray-900 mr-1" size={16} />
                      ) : (
                        <Zap className="text-gray-400 mr-1" size={16} />
                      )}
                      <p className="text-gray-900 font-medium capitalize">{profile.tier} Tier</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Headphones className="mr-2" size={24} />
                  Usage Statistics
                </h2>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 font-medium">Generations Today</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {profile.daily_generation_count} / 100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gray-900 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((profile.daily_generation_count / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {profile.last_generation_date ? `Last used: ${profile.last_generation_date}` : 'No generations yet'}
                  </p>
                </div>
              </div>

              {/* Premium Section - Special gradient design */}
              {profile?.tier === 'free' && (
                <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
                  <div className="text-center mb-6">
                    <Crown className="mx-auto text-gray-900 mb-3" size={32} />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
                    <p className="text-gray-600">Unlock the full potential of boksu.ai</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center">
                      <Zap className="text-gray-900 mr-3 flex-shrink-0" size={18} />
                      <span className="text-sm text-gray-700">Unlimited generations</span>
                    </div>
                    <div className="flex items-center">
                      <Headphones className="text-gray-900 mr-3 flex-shrink-0" size={18} />
                      <span className="text-sm text-gray-700">Premium voices</span>
                    </div>
                    <div className="flex items-center">
                      <Download className="text-gray-900 mr-3 flex-shrink-0" size={18} />
                      <span className="text-sm text-gray-700">MP3 downloads</span>
                    </div>
                    <div className="flex items-center">
                      <Crown className="text-gray-900 mr-3 flex-shrink-0" size={18} />
                      <span className="text-sm text-gray-700">Priority processing</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpgrade}
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 font-medium py-3 rounded-lg"
                  >
                    Upgrade Now
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-3"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};