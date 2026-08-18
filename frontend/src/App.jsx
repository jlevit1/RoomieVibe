import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import PostListing from './pages/PostListing';
import MyListings from './pages/MyListings';
import AdminPending from './pages/AdminPending';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
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

          <Route
            path="/admin/pending"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPending />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
