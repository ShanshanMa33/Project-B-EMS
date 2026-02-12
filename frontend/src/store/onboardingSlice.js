import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    createMyOnboarding,
    getMyOnboarding,
    submitMyOnboarding,
    updateMyOnboarding,
} from "../api/onboardingApi";

const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;

export const fetchOnboarding = createAsyncThunk("onboarding/fetch", async (_, thunkAPI) => {
    try {
        const res = await getMyOnboarding();
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(e, "Failed to load onboarding"));
    }
});

export const createOnboarding = createAsyncThunk("onboarding/create", async (_, thunkAPI) => {
    try {
        const res = await createMyOnboarding();
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(e, "Failed to create onboarding"));
    }
});

export const saveOnboarding = createAsyncThunk("onboarding/save", async (payload, thunkAPI) => {
    try {
        const res = await updateMyOnboarding(payload);
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(e, "Failed to save onboarding"));
    }
});

export const submitOnboarding = createAsyncThunk("onboarding/submit", async (_, thunkAPI) => {
    try {
        const res = await submitMyOnboarding();
        return res.data;
    } catch (e) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(e, "Failed to submit onboarding"));
    }
});

const slice = createSlice({
    name: "onboarding",
    initialState: {
        application: null,
        loading: false,
        error: null,
        initialized: false,
        draft: null,
        draftDirty: false,
    },
    reducers: {
        setOnboardingDraft(state, action) {
            state.draft = action.payload;
            state.draftDirty = true;
        },
        clearOnboardingDraft(state) {
            state.draft = null;
            state.draftDirty = false;
        },
    },
    extraReducers: (b) => {
        b.addCase(saveOnboarding.fulfilled, (s) => {
            s.draft = null;
            s.draftDirty = false;
        });
        b.addCase(submitOnboarding.fulfilled, (s) => {
            s.draft = null;
            s.draftDirty = false;
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

export const { setOnboardingDraft, clearOnboardingDraft } = slice.actions;
export default slice.reducer;
