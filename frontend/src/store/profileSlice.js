import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getEmployeeProfile, updateEmployeeProfile } from "../api/userApi";

const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;

// GET profile
export const fetchProfile = createAsyncThunk("profile/fetch", async (_, thunkAPI) => {
    try {
        const res = await getEmployeeProfile();
        return res.data;
    } catch (err) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(err, "Failed to load profile"));
    }
});

// PUT profile
export const updateProfile = createAsyncThunk("profile/update", async (updates, thunkAPI) => {
    try {
        const res = await updateEmployeeProfile(updates);
        return res.data;
    } catch (err) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(err, "Failed to update profile"));
    }
});

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        profile: null,
        loading: false,
        error: null,
        initialized: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // fetch
            .addCase(fetchProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
                state.initialized = true;
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to load profile";
                state.initialized = true;
            })

            // update
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;

                state.profile = action.payload;

                // If your backend returns only partial fields instead, use this instead:
                // state.profile = { ...(state.profile || {}), ...(action.payload || {}) };
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to update profile";
            });
    },
});

export default profileSlice.reducer;
