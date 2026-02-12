import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMyVisaCase, uploadVisaDocumentApi } from '../api/visaApi';

const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback;

// Async thunk to fetch visa cases for the current user
export const fetchVisaCases = createAsyncThunk("visa/fetch", async (_, thunkAPI) => {
    try {
        const response = await getMyVisaCase();
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(error, "Failed to load visa cases"));
    }
});

// Async thunk to upload a new visa document for the current user
export const uploadVisaDocument = createAsyncThunk("visa/uploadDocument", async ({ docType, file }, thunkAPI) => {
    try {
        await uploadVisaDocumentApi({ docType, file });
        const refreshed = await thunkAPI.dispatch(fetchVisaCases()).unwrap();
        thunkAPI.dispatch({ type: "hr/invalidateVisaRows" });
        return {
            message: "Document uploaded successfully",
            visaCase: refreshed,
        };
    } catch (error) {
        return thunkAPI.rejectWithValue(getApiErrorMessage(error, "Failed to upload visa document"));
    }
});

// Initial state for the visa slice
const initialState = {
    visaCase: null,
    loading: false,
    error: null,
    initialized: false,
    success: false,
    message: null,
};

// Visa slice definition
const visaSlice = createSlice({
    name: "visa",
    initialState,
    reducers: {
        clearVisaState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
            state.message = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVisaCases.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
                state.message = null;
            })
            // Handle successful fetch of visa cases
            .addCase(fetchVisaCases.fulfilled, (state, action) => {
                state.loading = false;
                state.visaCase = action.payload;
                state.initialized = true;
                state.success = true;
            })
            // Handle failure to fetch visa cases
            .addCase(fetchVisaCases.rejected, (state, action) => {
                state.loading = false;
                state.initialized = true;
                state.error = action.payload || "Failed to load visa cases";
            })
            // Handle uploading a new visa document
            .addCase(uploadVisaDocument.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
                state.message = null;
            })
            // Handle successful upload of a new visa document
            .addCase(uploadVisaDocument.fulfilled, (state, action) => {
                state.loading = false;
                state.visaCase = action.payload.visaCase ?? action.payload;
                state.success = true;
                state.message = action.payload.message || "Document uploaded successfully";
            })
            // Handle failure to upload a new visa document
            .addCase(uploadVisaDocument.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Failed to upload visa document";
            })
    }
});

export const { clearVisaState } = visaSlice.actions;
export default visaSlice.reducer;
