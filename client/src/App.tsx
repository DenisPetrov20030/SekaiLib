import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './app/routes';
import { initializeAuth } from './features/auth/store/authSlice';
import { DialogProvider } from './shared/hooks/useDialog';

function App() {
  useEffect(() => {
    store.dispatch(initializeAuth());
  }, []);

  return (
    <Provider store={store}>
      <DialogProvider>
        <RouterProvider router={router} />
      </DialogProvider>
    </Provider>
  );
}

export default App;
