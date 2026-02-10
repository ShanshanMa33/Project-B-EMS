import { configureStore } from '@reduxjs/toolkit';
import hrReducer from './hrSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    hr: hrReducer,
    auth: authReducer,
  },
});
