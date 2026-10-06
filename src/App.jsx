import { lazy, Suspense, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { PageLoader } from './components/common/Feedback.jsx';
import ScrollToTop from './components/common/ScrollToTop.jsx';
import { authActions } from './features/auth/authSlice.js';
import { metaActions } from './features/meta/metaSlice.js';
import HomePage from './pages/HomePage.jsx';

const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/guest/CheckoutPage.jsx'));
const ConfirmationPage = lazy(() => import('./pages/guest/ConfirmationPage.jsx'));
const MyBookingsPage = lazy(() => import('./pages/guest/MyBookingsPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard.jsx'));
const OwnerListings = lazy(() => import('./pages/owner/OwnerListings.jsx'));
const PropertyFormPage = lazy(() => import('./pages/owner/PropertyFormPage.jsx'));
const OwnerReservations = lazy(() => import('./pages/owner/OwnerReservations.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties.jsx'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings.jsx'));

const ownerNav = [
  { to: '/owner', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/owner/listings', label: 'My listings', icon: 'home' },
  { to: '/owner/listings/new', label: 'New listing', icon: 'plus' },
  { to: '/owner/reservations', label: 'Reservations', icon: 'calendar' },
];
const adminNav = [
  { to: '/admin', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/properties', label: 'Properties', icon: 'home' },
  { to: '/admin/bookings', label: 'Bookings', icon: 'calendar' },
];

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(metaActions.metaRequest());
    dispatch(authActions.sessionRequest());
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="properties/:id" element={<PropertyDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="checkout/:propertyId" element={<CheckoutPage />} />
              <Route path="bookings/:id/confirmation" element={<ConfirmationPage />} />
              <Route path="account/bookings" element={<MyBookingsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['owner', 'admin']} />}>
              <Route path="owner" element={<DashboardLayout title="Host dashboard" nav={ownerNav} />}>
                <Route index element={<OwnerDashboard />} />
                <Route path="listings" element={<OwnerListings />} />
                <Route path="listings/new" element={<PropertyFormPage />} />
                <Route path="listings/:id/edit" element={<PropertyFormPage />} />
                <Route path="reservations" element={<OwnerReservations />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin" element={<DashboardLayout title="Admin console" nav={adminNav} />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="properties" element={<AdminProperties />} />
                <Route path="bookings" element={<AdminBookings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
