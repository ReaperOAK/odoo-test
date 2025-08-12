import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// Move components outside to prevent recreation on each render
const ProfileHeader = ({ user }) => (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
    <div className="absolute inset-0 bg-black opacity-10"></div>
    <div className="relative z-10 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold backdrop-blur-sm">
        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold mb-2">
          {user?.name || user?.email || 'User'}
        </h1>
        <p className="text-blue-100 text-lg">
          {user?.isHost ? '🏠 Host' : '👤 Member'} 
          {user?.role === 'admin' && ' • 👑 Admin'}
        </p>
        <p className="text-blue-200 mt-1">
          Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </div>
    </div>
  </div>
);

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => (
  <div className="border-b border-gray-200 mb-8">
    <nav className="-mb-px flex space-x-8 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  </div>
);

const PersonalInfoTab = ({ personalInfo, setPersonalInfo, handlePersonalInfoSubmit, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <span className="text-blue-600 text-xl">👤</span>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <p className="text-gray-600">Update your personal details and profile information</p>
      </div>
    </div>
    
    <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
      <Input
        label="Full Name"
        value={personalInfo.name}
        onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Enter your full name"
        required
      />
      
      <Input
        label="Email Address"
        type="email"
        value={personalInfo.email}
        onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Enter your email"
        disabled
        className="bg-gray-50 cursor-not-allowed"
      />
      
      <Input
        label="Phone Number"
        type="tel"
        value={personalInfo.phone}
        onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
        placeholder="Enter your phone number"
      />
      
      <Input
        label="Address"
        value={personalInfo.address}
        onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
        placeholder="Enter your address"
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        <textarea
          value={personalInfo.bio}
          onChange={(e) => setPersonalInfo(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Tell us about yourself..."
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm text-blue-700 font-medium">Note about email changes</p>
            <p className="text-sm text-blue-600 mt-1">
              Email address cannot be changed for security reasons. If you need to change your email, please contact support.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" loading={loading} className="px-8">
          Save Changes
        </Button>
      </div>
    </form>
  </div>
);

const SecurityTab = ({ passwordForm, setPasswordForm, handlePasswordSubmit, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
        <span className="text-green-600 text-xl">🔒</span>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
        <p className="text-gray-600">Manage your password and security preferences</p>
      </div>
    </div>
    
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      <Input
        label="Current Password"
        type="password"
        value={passwordForm.currentPassword}
        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
        placeholder="Enter your current password"
        required
      />
      
      <Input
        label="New Password"
        type="password"
        value={passwordForm.newPassword}
        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
        placeholder="Enter your new password"
        required
      />
      
      <Input
        label="Confirm New Password"
        type="password"
        value={passwordForm.confirmPassword}
        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
        placeholder="Confirm your new password"
        required
      />
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-center space-x-2">
            <span className={passwordForm.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}>
              {passwordForm.newPassword.length >= 6 ? '✓' : '○'}
            </span>
            <span>At least 6 characters long</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className={passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword ? 'text-green-600' : 'text-gray-400'}>
              {passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword ? '✓' : '○'}
            </span>
            <span>Passwords match</span>
          </li>
        </ul>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" loading={loading} className="px-8">
          Update Password
        </Button>
      </div>
    </form>
  </div>
);

const HostTab = ({ user, hostInfo, setHostInfo, handleBecomeHost, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
        <span className="text-purple-600 text-xl">🏠</span>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {user?.isHost ? 'Host Settings' : 'Become a Host'}
        </h2>
        <p className="text-gray-600">
          {user?.isHost 
            ? 'Manage your host profile and business information'
            : 'Start renting out your items and earn money'
          }
        </p>
      </div>
    </div>

    {!user?.isHost && (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">Why become a host?</h3>
        <ul className="text-purple-700 space-y-2 mb-4">
          <li className="flex items-center space-x-2">
            <span className="text-green-600">✓</span>
            <span>Earn money from your unused items</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-green-600">✓</span>
            <span>Help others in your community</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-green-600">✓</span>
            <span>Full control over your listings</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-green-600">✓</span>
            <span>Secure payments through our platform</span>
          </li>
        </ul>
      </div>
    )}

    {user?.isHost && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-green-600 text-lg">✅</span>
          <div>
            <p className="text-green-800 font-medium">You are a verified host!</p>
            <p className="text-green-700 text-sm">You can now create listings and start earning money.</p>
          </div>
        </div>
      </div>
    )}
    
    <div className="space-y-6">
      <Input
        label="Business/Display Name"
        value={hostInfo.businessName}
        onChange={(e) => setHostInfo(prev => ({ ...prev, businessName: e.target.value }))}
        placeholder="Enter your business or display name"
        required={!user?.isHost}
      />
      
      <Input
        label="Business Address"
        value={hostInfo.businessAddress}
        onChange={(e) => setHostInfo(prev => ({ ...prev, businessAddress: e.target.value }))}
        placeholder="Enter your business address"
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
        <textarea
          value={hostInfo.description}
          onChange={(e) => setHostInfo(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your business and what you offer..."
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-500 mt-0.5">ℹ️</span>
          <div>
            <p className="text-sm text-blue-700 font-medium">Phone number required</p>
            <p className="text-sm text-blue-600 mt-1">
              Please ensure your phone number is updated in the Personal Info tab as it's required for host verification.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleBecomeHost} 
          loading={loading} 
          className="px-8"
        >
          {user?.isHost ? 'Update Host Profile' : 'Become a Host'}
        </Button>
      </div>
    </div>
  </div>
);

const NotificationsTab = ({ notifications, setNotifications, handleNotificationsSave, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
        <span className="text-yellow-600 text-xl">🔔</span>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        <p className="text-gray-600">Choose how you want to be notified about activity</p>
      </div>
    </div>
    
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'emailBookings', label: 'Booking confirmations and updates', desc: 'Get notified when someone books your items or your bookings change' },
            { key: 'emailMessages', label: 'Messages from hosts and renters', desc: 'Receive emails when you get new messages' },
            { key: 'emailPromotions', label: 'Promotions and special offers', desc: 'Hear about discounts, new features, and special events' }
          ].map((item) => (
            <div key={item.key} className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label className="text-sm font-medium text-gray-900">{item.label}</label>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'smsBookings', label: 'Booking reminders', desc: 'Get SMS reminders about upcoming pickups and returns' },
            { key: 'smsReminders', label: 'Important reminders', desc: 'Receive SMS for time-sensitive notifications' }
          ].map((item) => (
            <div key={item.key} className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label className="text-sm font-medium text-gray-900">{item.label}</label>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-500 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm text-yellow-700 font-medium">Coming Soon</p>
            <p className="text-sm text-yellow-600 mt-1">
              Notification preferences will be fully implemented in the next update. Your selections are saved locally for now.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={handleNotificationsSave} loading={loading} className="px-8">
          Save Preferences
        </Button>
      </div>
    </div>
  </div>
);

const AlertMessage = ({ success, error }) => {
  if (!success && !error) return null;
  
  return (
    <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 transition-all transform ${
      success 
        ? 'bg-green-50 border border-green-200 text-green-800' 
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          {success ? '✅' : '❌'}
        </span>
        <p className="font-medium">{success || error}</p>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    address: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [hostInfo, setHostInfo] = useState({
    businessName: '',
    businessAddress: '',
    description: ''
  });

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailMessages: true,
    emailPromotions: false,
    smsBookings: true,
    smsReminders: true
  });

  // Initialize form data
  useEffect(() => {
    if (user) {
      console.log('User data received:', user);
      
      const newPersonalInfo = {
        name: user.name || '',
        email: user.email || '',
        phone: user.hostProfile?.phone || '',
        bio: user.hostProfile?.bio || '',
        address: user.hostProfile?.address || ''
      };
      
      console.log('Setting personal info:', newPersonalInfo);
      setPersonalInfo(newPersonalInfo);
      
      if (user.hostProfile) {
        const newHostInfo = {
          businessName: user.hostProfile.displayName || '',
          businessAddress: user.hostProfile.address || '',
          description: user.hostProfile.bio || ''
        };
        
        console.log('Setting host info:', newHostInfo);
        setHostInfo(newHostInfo);
      }
    }
  }, [user]);

  const showMessage = (type, message) => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data according to backend schema
      const updateData = {
        name: personalInfo.name,
        hostProfile: {
          phone: personalInfo.phone,
          bio: personalInfo.bio,
          address: personalInfo.address
        }
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await authAPI.updateProfile(updateData);
      const updatedUser = response.data.data.user;
      
      console.log('Update response:', updatedUser);
      
      // Update the auth context
      updateUser(updatedUser);
      
      // Update form data to reflect the server response
      const newPersonalInfo = {
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.hostProfile?.phone || '',
        bio: updatedUser.hostProfile?.bio || '',
        address: updatedUser.hostProfile?.address || ''
      };
      
      console.log('Updating form with:', newPersonalInfo);
      setPersonalInfo(newPersonalInfo);
      
      // Also update host info if it exists
      if (updatedUser.hostProfile) {
        setHostInfo({
          businessName: updatedUser.hostProfile.displayName || '',
          businessAddress: updatedUser.hostProfile.address || '',
          description: updatedUser.hostProfile.bio || ''
        });
      }
      
      showMessage('success', 'Personal information updated successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeHost = async () => {
    if (!hostInfo.businessName.trim()) {
      showMessage('error', 'Business name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      let response;
      
      if (user?.isHost) {
        // Update existing host profile
        const updateData = {
          name: personalInfo.name, // Keep the name as is
          hostProfile: {
            displayName: hostInfo.businessName,
            address: hostInfo.businessAddress,
            bio: hostInfo.description,
            phone: personalInfo.phone
          }
        };
        response = await authAPI.updateProfile(updateData);
      } else {
        // Become a new host
        const requestData = {
          hostProfile: {
            displayName: hostInfo.businessName,
            address: hostInfo.businessAddress,
            bio: hostInfo.description,
            phone: personalInfo.phone
          }
        };
        response = await authAPI.becomeHost(requestData);
      }
      
      const updatedUser = response.data.data.user;
      
      // Update the auth context
      updateUser(updatedUser);
      
      // Update form data to reflect the server response
      setPersonalInfo(prev => ({
        ...prev,
        phone: updatedUser.hostProfile?.phone || prev.phone,
        bio: updatedUser.hostProfile?.bio || prev.bio,
        address: updatedUser.hostProfile?.address || prev.address
      }));
      
      // Update host info
      setHostInfo({
        businessName: updatedUser.hostProfile?.displayName || '',
        businessAddress: updatedUser.hostProfile?.address || '',
        description: updatedUser.hostProfile?.bio || ''
      });
      
      showMessage('success', user?.isHost ? 'Host profile updated successfully!' : 'Congratulations! You are now a host!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update host profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSave = () => {
    // Save to localStorage for now since backend doesn't support it yet
    localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
    showMessage('success', 'Notification preferences saved locally!');
  };

  // Load notification preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
      try {
        setNotifications(JSON.parse(savedPreferences));
      } catch (e) {
        console.warn('Failed to parse saved notification preferences');
      }
    }
  }, []);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'host', label: user?.isHost ? 'Host Settings' : 'Become a Host', icon: '🏠' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AlertMessage success={success} error={error} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileHeader user={user} />
        <TabNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'personal' && (
            <PersonalInfoTab 
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              handlePersonalInfoSubmit={handlePersonalInfoSubmit}
              loading={loading}
            />
          )}
          {activeTab === 'security' && (
            <SecurityTab 
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              handlePasswordSubmit={handlePasswordSubmit}
              loading={loading}
            />
          )}
          {activeTab === 'host' && (
            <HostTab 
              user={user}
              hostInfo={hostInfo}
              setHostInfo={setHostInfo}
              handleBecomeHost={handleBecomeHost}
              loading={loading}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab 
              notifications={notifications}
              setNotifications={setNotifications}
              handleNotificationsSave={handleNotificationsSave}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
