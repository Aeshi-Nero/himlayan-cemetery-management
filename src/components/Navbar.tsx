import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, MapPin, Grid, LogIn, LogOut, Wrench, Home, Shield, User, Mail, Pencil, Camera, Check, X, Lock, RotateCcw, RotateCw, Bell, Trash2, Calendar, CheckCircle2, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

import solanoLguSealImg from '../assets/images/solano_lgu_seal_1784964597638.jpg';
import himlayanLogoOfficialImg from '../assets/images/himlayan_logo_official_1785166790688.jpg';
import engineerAvatarImg from '../assets/images/untitled_design_1784969951289.jpg';

interface NavbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onLogout?: () => void;
  onSaveAssets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onLogout,
  onSaveAssets,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Lot Acquired',
      message: 'Inquirer Maria Santos successfully acquired Lot #C-12 in Section C.',
      time: '10 mins ago',
      type: 'success',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Burial Scheduled',
      message: 'Upcoming burial ceremony scheduled for Juan Dela Cruz at Lot #A-05 on July 29, 2026, 10:00 AM.',
      time: '1 hr ago',
      type: 'schedule',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Pending Reservation',
      message: 'New inquiry reservation submitted for Lot #B-08 in Solano Public Cemetery.',
      time: '3 hrs ago',
      type: 'info',
      read: false,
    },
    {
      id: 'notif-4',
      title: 'Perimeter Updated',
      message: 'Autosaved cemetery master perimeter polygon boundary with border nodes.',
      time: '5 hrs ago',
      type: 'system',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, updateUser } = useAuthStore();

  useEffect(() => {
    if (user) {
      setNameValue(user.full_name || 'Cemetery Engineer');
      setEmailValue(user.email || 'engineer@himlayan.solano.gov.ph');
    }
  }, [user]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (profileModalRef.current && !profileModalRef.current.contains(event.target as Node)) {
        setShowProfileModal(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          updateUser({ avatar: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentAvatar = user?.avatar || engineerAvatarImg;

  const navLinks = [
    { name: 'Home Page', path: '/', icon: Home },
    { name: 'Memorial Lots', path: '/lots', icon: Grid },
    { name: 'Interactive Map', path: '/map', icon: MapPin },
  ];

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-16 py-2.5 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200 text-slate-900'
          : 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Left Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <img
            src={solanoLguSealImg}
            alt="LGU Solano Seal"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
          />
          <span className="text-slate-300 font-light text-lg sm:text-xl select-none px-0.5">|</span>
          <div className="flex items-center">
            <img
              src={himlayanLogoOfficialImg}
              alt="Himlayan ng Bayan Logo"
              className="h-9 sm:h-10 max-w-[180px] sm:max-w-[220px] object-contain mix-blend-multiply group-hover:opacity-90 transition-opacity"
            />
          </div>
          {user?.role === 'engineer' && location.pathname === '/engineer/workspace' && (
            <>
              <span className="text-slate-300 font-light text-lg sm:text-xl select-none px-1">|</span>
              <span className="font-heading font-bold tracking-wide text-slate-900 text-xs sm:text-sm hidden md:inline-flex items-center">
                Engineer Editing Workspace
              </span>
            </>
          )}
        </Link>

        {/* Center Pill Nav - Perfectly Centered (Hidden for Engineer) */}
        {(!isAuthenticated || user?.role !== 'engineer') && location.pathname !== '/engineer/workspace' && (
          <div className="hidden md:flex items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100/90 rounded-full p-1 border border-slate-200 gap-1 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            user?.role === 'engineer' ? (
              <div className="flex items-center gap-3 relative" ref={profileModalRef}>
                {/* Hidden File Input for Avatar Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />

                {/* Undo, Redo & Notification Bell Action Buttons (Left side of circular avatar frame) */}
                <div className="flex items-center gap-1.5 mr-1" ref={notificationsRef}>
                  {/* Undo Button */}
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-2 rounded-full border transition-all cursor-pointer ${
                      canUndo
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs active:scale-95'
                        : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                    }`}
                    title="Undo Action (Ctrl+Z)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Redo Button */}
                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-2 rounded-full border transition-all cursor-pointer ${
                      canRedo
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-xs active:scale-95'
                        : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                    }`}
                    title="Redo Action (Ctrl+Y)"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Notification Bell Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs transition-all cursor-pointer active:scale-95 focus:outline-none"
                      title="Engineer Notifications"
                    >
                      <Bell className="w-4 h-4 text-slate-700" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown Popover */}
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-slate-900 z-50 font-body"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                                <Bell className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-heading font-bold text-slate-900 text-sm">Engineer Alerts</h4>
                                <p className="text-[11px] text-slate-500 font-medium">Inquiries, lot acquisitions & burials</p>
                              </div>
                            </div>
                            {unreadCount > 0 && (
                              <button
                                onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>

                          <div className="max-h-80 overflow-y-auto py-2 space-y-2 pr-0.5">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center text-slate-400 text-xs">
                                No notifications right now
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div
                                  key={notif.id}
                                  onClick={() => {
                                    setNotifications((prev) =>
                                      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                                    );
                                  }}
                                  className={`p-3 rounded-xl border text-xs transition-all cursor-pointer relative ${
                                    notif.read
                                      ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                                      : 'bg-emerald-50/60 border-emerald-200/80 text-slate-800 font-medium shadow-2xs'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                      {notif.type === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                                      {notif.type === 'schedule' && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                                      {notif.type === 'info' && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                      {notif.type === 'system' && <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />}
                                      <span>{notif.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                                  </div>
                                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{notif.message}</p>
                                </div>
                              ))
                            )}
                          </div>

                          {notifications.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                              <button
                                onClick={() => setNotifications([])}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Clear all</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Circular Profile Picture Frame */}
                <button
                  onClick={() => setShowProfileModal(!showProfileModal)}
                  className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md hover:scale-105 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 group shrink-0"
                  title="Click to view account info"
                >
                  <img
                    src={currentAvatar}
                    alt={user?.full_name || 'Engineer'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                </button>

                {/* Account Info White Box Dropdown (Appears on click) */}
                <AnimatePresence>
                  {showProfileModal && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-14 w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 text-slate-900 z-50 font-body"
                    >
                      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                        <div
                          className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-600 shadow-md flex-shrink-0 cursor-pointer group"
                          onClick={() => fileInputRef.current?.click()}
                          title="Click to change profile picture"
                        >
                          <img
                            src={currentAvatar}
                            alt={user?.full_name || 'Engineer'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-medium">
                            <Camera className="w-4 h-4 mb-0.5" />
                            Change
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditingName ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="text"
                                value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-emerald-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-heading font-bold"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (nameValue.trim()) {
                                    updateUser({ full_name: nameValue.trim() });
                                  }
                                  setIsEditingName(false);
                                }}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setNameValue(user?.full_name || 'Cemetery Engineer');
                                  setIsEditingName(false);
                                }}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-heading font-bold text-slate-900 text-sm truncate">
                                {user?.full_name || 'Cemetery Engineer'}
                              </h4>
                              <button
                                onClick={() => setIsEditingName(true)}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors flex-shrink-0"
                                title="Edit Name"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="py-3.5 space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2 text-slate-600">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            {isEditingEmail ? (
                              <input
                                type="email"
                                value={emailValue}
                                onChange={(e) => setEmailValue(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-emerald-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                                autoFocus
                              />
                            ) : (
                              <span className="truncate">{user?.email || 'engineer@himlayan.solano.gov.ph'}</span>
                            )}
                          </div>
                          {isEditingEmail ? (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  if (emailValue.trim()) {
                                    updateUser({ email: emailValue.trim() });
                                  }
                                  setIsEditingEmail(false);
                                }}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEmailValue(user?.email || 'engineer@himlayan.solano.gov.ph');
                                  setIsEditingEmail(false);
                                }}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsEditingEmail(true)}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors flex-shrink-0"
                              title="Edit Email"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-slate-600">
                          <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>Role: <strong className="text-slate-900 capitalize">{user?.role || 'Engineer'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-600">
                          <Wrench className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>Access: <strong className="text-emerald-700">Full GIS & Lot Management</strong></span>
                        </div>
                      </div>

                      {/* Password Change Section */}
                      <div className="pt-3 border-t border-slate-100">
                        {isChangingPassword ? (
                          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                Update Password
                              </span>
                              <button
                                onClick={() => {
                                  setIsChangingPassword(false);
                                  setNewPassword('');
                                  setConfirmPassword('');
                                  setPasswordError('');
                                  setPasswordMessage('');
                                }}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                            <input
                              type="password"
                              placeholder="New Password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            />
                            <input
                              type="password"
                              placeholder="Confirm New Password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            />
                            {passwordError && (
                              <p className="text-[10px] text-rose-600 font-medium">{passwordError}</p>
                            )}
                            {passwordMessage && (
                              <p className="text-[10px] text-emerald-600 font-medium">{passwordMessage}</p>
                            )}
                            <button
                              onClick={() => {
                                if (!newPassword || newPassword.length < 6) {
                                  setPasswordError('Password must be at least 6 characters');
                                  return;
                                }
                                if (newPassword !== confirmPassword) {
                                  setPasswordError('Passwords do not match');
                                  return;
                                }
                                setPasswordError('');
                                setPasswordMessage('Password updated successfully!');
                                setTimeout(() => {
                                  setIsChangingPassword(false);
                                  setNewPassword('');
                                  setConfirmPassword('');
                                  setPasswordMessage('');
                                }, 1500);
                              }}
                              className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                            >
                              Save Password
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsChangingPassword(true)}
                            className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            Change Password
                          </button>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                        {onSaveAssets && (
                          <button
                            onClick={() => {
                              setShowProfileModal(false);
                              onSaveAssets();
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Save Placed Assets
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowProfileModal(false);
                            if (onLogout) {
                              onLogout();
                            } else {
                              logout();
                              navigate('/');
                            }
                          }}
                          className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      logout();
                      navigate('/');
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-2 text-xs font-bold font-body flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-300" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/admin/dashboard"
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )
          ) : (
            <Link
              to="/login"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5 py-2.5 text-xs font-bold font-body flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-300" />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          {(!isAuthenticated || user?.role !== 'engineer') && location.pathname !== '/engineer/workspace' && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer focus:outline-none shrink-0"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-5 py-4 space-y-2.5 pb-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

              {/* Mobile CTA Login/Portal if not on md screen */}
              <div className="pt-2.5 border-t border-slate-100">
                {isAuthenticated ? (
                  user?.role === 'engineer' ? (
                    <Link
                      to="/engineer/workspace"
                      className="flex items-center justify-between px-4 py-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200"
                    >
                      <span>Engineer Workspace</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </Link>
                  ) : (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center justify-between px-4 py-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200"
                    >
                      <span>Admin Portal</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </Link>
                  )
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    <LogIn className="w-4 h-4 text-slate-300" />
                    <span>Login to Portal</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
