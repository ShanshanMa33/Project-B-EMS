import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/client";

// Thunks for onboarding application
export const fetchOnboarding = createAsyncThunk("onboarding/fetch", async (_, thunkAPI) => {
    try {
        const res = await api.get("/api/onboarding");
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to load onboarding");
    }
});

// Create a new onboarding application (or get existing draft)
export const createOnboarding = createAsyncThunk("onboarding/create", async (_, thunkAPI) => {
    try {
        const res = await api.post("/api/onboarding", {});
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to create onboarding");
    }
});

// Update onboarding application (e.g. submit for review)
export const saveOnboarding = createAsyncThunk("onboarding/save", async (payload, thunkAPI) => {
    try {
        const res = await api.put("/api/onboarding", payload);
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to save onboarding");
    }
});

// Submit onboarding application for HR review
export const submitOnboarding = createAsyncThunk("onboarding/submit", async (_, thunkAPI) => {
    try {
        const res = await api.put("/api/onboarding", { action: "submit" });
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(e.response?.data?.message || "Failed to submit onboarding");
    }
});

// Resubmit onboarding application after rejection
const slice = createSlice({
    name: "onboarding",
    initialState: { application: null, loading: false, error: null },
    reducers: {},
    extraReducers: (b) => {
        // Handle all pending/fulfilled/rejected cases for onboarding thunks
        b.addMatcher((a) => a.type.startsWith("onboarding/") && a.type.endsWith("/pending"), (s) => {
            s.loading = true; s.error = null;
        });
        // On success, update the application state with the returned data
        b.addMatcher((a) => a.type.startsWith("onboarding/") && a.type.endsWith("/fulfilled"), (s, a) => {
            s.loading = false; s.application = a.payload;
        });
        // On failure, set the error message
        b.addMatcher((a) => a.type.startsWith("onboarding/") && a.type.endsWith("/rejected"), (s, a) => {
            s.loading = false; s.error = a.payload || "Error";
        });
    },
});

export default slice.reducer;
