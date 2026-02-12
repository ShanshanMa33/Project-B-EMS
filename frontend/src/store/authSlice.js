import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';

// Async thunk for user sign-in
export const signIn = createAsyncThunk("auth/signin", async (payload, thunkAPI) => {
    try {
        const response = await api.post("/api/auth/signin", {
            username: payload.username,
            password: payload.password,
        });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data || { message: "Sign-in failed" });
    }
});

// Async thunk to fetch current user info
export const fetchCurrentUser = createAsyncThunk("auth/me", async (_, thunkAPI) => {
    try {
        const response = await api.get("/api/auth/me");
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data || { message: "Failed to fetch user" });
    }
});

// Async thunk for registration with invitation token
export const registerWithToken = createAsyncThunk("auth/registerWithToken", async (payload, thunkAPI) => {
    try {
        const response = await api.post("/api/auth/register-with-token", {
            token: payload.token,
            username: payload.username,
            password: payload.password,
        });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data || { message: "Registration failed" });
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
                state.error = action.payload?.message || action.error?.message || "Sign-in failed";
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
                state.error = action.payload?.message || "Failed to fetch user";
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
                state.error = action.payload?.message || "Registration failed";
            });
    }
});


export const { logout } = authSlice.actions;
export default authSlice.reducer;
