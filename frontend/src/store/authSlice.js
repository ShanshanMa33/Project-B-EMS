import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    login,
    registerWithInvitationToken,
} from '../api/authApi';
import { getUserMe } from '../api/userApi';

const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;

// Async thunk for user sign-in
export const signIn = createAsyncThunk("auth/signin", async (payload, thunkAPI) => {
    try {
        const response = await login(payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(error, "Sign-in failed"));
    }
});

// Async thunk to fetch current user info
export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, thunkAPI) => {
    try {
        const response = await getUserMe();
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(error, "Failed to fetch user"));
    }
});

// Async thunk for registration with invitation token
export const registerWithToken = createAsyncThunk("auth/registerWithToken", async (payload, thunkAPI) => {
    try {
        const response = await registerWithInvitationToken(payload);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(error, "Registration failed"));
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState: {
        token: localStorage.getItem("token") || null,
        user: JSON.parse(localStorage.getItem("user")) || null,
        loading: false,
        error: null,
    },
    reducers: {
        logout(state) {
            state.token = null;
            state.user = null;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        },
    },
    extraReducers: (builder) => {
        builder.addCase(signIn.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            // Handle successful sign-in
            .addCase(signIn.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                localStorage.setItem("token", action.payload.token);
                localStorage.setItem("user", JSON.stringify(action.payload.user));
            })
            // Handle sign-in failure
            .addCase(signIn.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Sign-in failed";
            })
            // Handle fetching current user info
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                localStorage.setItem("user", JSON.stringify(action.payload.user));
            })
            .addCase(fetchCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch user";
                state.token = null;
                state.user = null;
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            })
            .addCase(registerWithToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerWithToken.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(registerWithToken.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Registration failed";
            });
    }
});


export const { logout } = authSlice.actions;
export default authSlice.reducer;
