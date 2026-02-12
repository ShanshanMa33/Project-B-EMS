import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/client";

// GET profile
export const fetchProfile = createAsyncThunk("profile/fetch", async (_, thunkAPI) => {
    try {
        const res = await api.get("/api/employee/profile");
        return res.data;
    } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load profile";
        return thunkAPI.rejectWithValue({ message: msg });
    }
});

// PUT profile
export const updateProfile = createAsyncThunk("profile/update", async (updates, thunkAPI) => {
    try {
        const res = await api.put("/api/employee/profile", updates);
        return res.data;
    } catch (err) {
        const msg = err?.response?.data?.message || "Failed to update profile";
        return thunkAPI.rejectWithValue({ message: msg });
    }
});

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        profile: null,
        loading: false,
        error: null,
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
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to load profile";
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
                state.error = action.payload?.message || "Failed to update profile";
            });
    },
});

export default profileSlice.reducer;
