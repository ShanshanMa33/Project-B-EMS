import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/client";
import { logout, signIn } from "./authSlice";

export const fetchOnboarding = createAsyncThunk("onboarding/fetch", async (_, thunkAPI) => {
    try {
        const res = await api.get("/api/onboarding");
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to load onboarding");
    }
});

export const createOnboarding = createAsyncThunk("onboarding/create", async (_, thunkAPI) => {
    try {
        const res = await api.post("/api/onboarding", {});
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to create onboarding");
    }
});

export const saveOnboarding = createAsyncThunk("onboarding/save", async (payload, thunkAPI) => {
    try {
        const res = await api.put("/api/onboarding", payload);
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to save onboarding");
    }
});

export const submitOnboarding = createAsyncThunk("onboarding/submit", async (action = "submit", thunkAPI) => {
    try {
        const res = await api.put("/api/onboarding", { action });
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to submit onboarding");
    }
});

const slice = createSlice({
    name: "onboarding",
    initialState: { application: null, loading: false, error: null, initialized: false },
    reducers: {},
    extraReducers: (b) => {
        b.addCase(signIn.fulfilled, (s) => {
            s.application = null;
            s.loading = false;
            s.error = null;
            s.initialized = false;
        });
        b.addCase(logout, (s) => {
            s.application = null;
            s.loading = false;
            s.error = null;
            s.initialized = false;
        });
        b.addMatcher((a) => a.type.startsWith("onboarding/") && a.type.endsWith("/pending"), (s) => {
            s.loading = true;
            s.error = null;
        });
        b.addMatcher((a) => a.type.startsWith("onboarding/") && a.type.endsWith("/fulfilled"), (s, a) => {
            s.loading = false;
            s.application = a.payload;
            s.initialized = true;
        });
        b.addMatcher((a) => a.type.startsWith("onboarding/") && a.type.endsWith("/rejected"), (s, a) => {
            s.loading = false;
            s.error = a.payload || "Error";
            s.initialized = true;
        });
    },
});

export default slice.reducer;
