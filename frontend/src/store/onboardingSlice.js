import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';

// Async thunk to fetch onboarding application
export const fetchOnboarding = createAsyncThunk("onboarding/fetch", async (_, thunkAPI) => {
    try {
        const response = await api.get("/api/onboarding");
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message || { message: "Failed to load onboarding" });
    }
});

// Async thunk to create onboarding application
export const createOnboarding = createAsyncThunk("onboarding/create", async (payload, thunkAPI) => {
    try {
        const response = await api.post("/api/onboarding", {});
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message || { message: "Failed to create onboarding" });
    }
});

// Async thunk to update onboarding application status
export const updateOnboarding = createAsyncThunk("onboarding/update", async ({ id, status }, thunkAPI) => {
    try {
        const response = await api.put(`api/onboarding/${id}`, { status });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message || { message: "Failed to update onboarding" });
    }
});

const onboardingSlice = createSlice({
    name: "onboarding",
    initialState: {
        application: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        // Handle fetching onboarding application
        builder.addCase(fetchOnboarding.fulfilled, (state, action) => { state.application = action.payload; })
            // Handle creating and updating onboarding application
            .addCase(createOnboarding.fulfilled, (state, action) => { state.application = action.payload; })
            // Handle updating onboarding application status
            .addCase(updateOnboarding.fulfilled, (state, action) => { state.application = action.payload; })
    }
});

export default onboardingSlice.reducer;