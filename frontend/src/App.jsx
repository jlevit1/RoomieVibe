import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingMessageButton from './components/FloatingMessageButton';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import PostListing from './pages/PostListing';
import MyListings from './pages/MyListings';
import RoommateBrowse from './pages/RoommateBrowse';
import RoommateDetail from './pages/RoommateDetail';
import RoommateProfileForm from './pages/RoommateProfileForm';
import Favorites from './pages/Favorites';
import Wallet from './pages/Wallet';
import TopUpResult from './pages/TopUpResult';
import Messages from './pages/Messages';
import ChatThread from './pages/ChatThread';
import Dashboard from './pages/admin/Dashboard';
import AdminPending from './pages/admin/AdminPending';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDisputes from './pages/admin/AdminDisputes';

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const hideFooter = isAdmin || isAuthPage;

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/listings/:id" element={<ListingDetail />} />

        <Route
          path="/listings/mine"
          element={
            <ProtectedRoute roles={['LANDLORD']}>
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/new"
          element={
            <ProtectedRoute roles={['LANDLORD']}>
              <PostListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            <ProtectedRoute roles={['LANDLORD']}>
              <PostListing />
            </ProtectedRoute>
          }
        />

        <Route path="/roommates" element={<RoommateBrowse />} />
        <Route path="/roommates/:id" element={<RoommateDetail />} />
        <Route
          path="/roommates/profile"
          element={
            <ProtectedRoute>
              <RoommateProfileForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet/topup-result"
          element={
            <ProtectedRoute>
              <TopUpResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <ChatThread />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="disputes" element={<AdminDisputes />} />
        </Route>
      </Routes>
      </main>
      {!hideFooter && <Footer />}
      {!isAdmin && <FloatingMessageButton />}
    </div>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
