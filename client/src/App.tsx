import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './app/routes';
import { initializeAuth } from './features/auth/store/authSlice';

function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
  }, []);

  // Persist last visited route and restore on reload
  useEffect(() => {
    const unsubscribe = router.subscribe((state) => {
      const loc = state.location;
      try {
        const href = `${loc.pathname}${loc.search}${loc.hash ?? ''}`;
        window.localStorage.setItem('lastRoute', href);
      } catch {}
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const saved = window.localStorage.getItem('lastRoute');
      if (saved && saved !== current) {
        router.navigate(saved);
      }
    } catch {}
  }, []);

  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
