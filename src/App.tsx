import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { MainIconSidebar } from './components/sidebar/MainIconSidebar';
import { ConversationList } from './components/sidebar/ConversationList';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageList } from './components/chat/MessageList';
import { MessageInput } from './components/chat/MessageInput';
import { UserDetailDrawer } from './components/chat/UserDetailDrawer';
import { CallOverlayModal } from './components/chat/CallOverlayModal';
import { FeedView } from './components/feed/FeedView';
import { SearchUsersModal } from './components/modals/SearchUsersModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { PasswordConfirmModal } from './components/modals/PasswordConfirmModal';
import { AdminPanelModal } from './components/modals/AdminPanelModal';
import { ToastContainer } from './components/common/ToastContainer';
import { sounds } from './services/audio';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading, pendingSwitchUser, cancelSwitchProfile } = useAuth();
  const { activeView } = useChat();

  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSound = () => {
    const updated = sounds.toggleSound();
    setSoundEnabled(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#120707]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#E53935] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#A98F8F] tracking-wider uppercase">
            Carregando RedChat...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {authView === 'login' ? (
          <LoginPage onNavigateToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
        )}
        <ToastContainer />
      </>
    );
  }

  return (
    <div
      id="redchat-main-app"
      className="h-screen w-screen flex bg-[#120707] text-[#F5EEEE] overflow-hidden select-none font-sans"
    >
      {/* 1. Narrow Left Icon Sidebar */}
      <MainIconSidebar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* 2. Conversations / Groups Column (Responsive Drawer on mobile) */}
      <div
        className={`fixed inset-y-0 left-[72px] z-30 md:static md:flex transition-transform duration-200 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <ConversationList
          onOpenSearch={() => {
            setIsSearchOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onOpenAdmin={() => {
            setIsAdminOpen(true);
            setIsMobileSidebarOpen(false);
          }}
        />
      </div>

      {/* Mobile Backdrop for Drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-20"
        />
      )}

      {/* 3. Main Center Content Area: Either Feed (Instagram style) or Live Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#120707] h-full relative">
        {activeView === 'feed' ? (
          <FeedView />
        ) : (
          <>
            <ChatHeader onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
            <MessageList />
            <MessageInput />
          </>
        )}
      </div>

      {/* 4. Right Side User Detail Drawer */}
      <UserDetailDrawer />

      {/* 5. Voice/Video Call and Screen Share Overlay */}
      <CallOverlayModal />

      {/* Modals */}
      <SearchUsersModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Admin Panel Master Modal */}
      {isAdmin && (
        <AdminPanelModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      )}

      {/* Secure Profile Switch Password Modal */}
      {pendingSwitchUser && (
        <PasswordConfirmModal
          isOpen={!!pendingSwitchUser}
          targetUser={pendingSwitchUser}
          onClose={cancelSwitchProfile}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ChatProvider>
          <MainLayout />
        </ChatProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
