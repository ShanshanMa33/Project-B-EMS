import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getHRApplications,
  getHRApplicationDetail,
  getHRProfiles,
  getHRVisaAll,
  reviewHRApplication,
  sendHRVisaNotification,
} from '../api/hr';

const mapApplication = (item) => ({
  id: item._id,
  userId: item.userId,
  name: item.name || 'N/A',
  email: item.email || '',
  position: item.position || '',
  status: item.status || 'Pending',
  feedback: item.feedback || '',
  date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
});

const mapVisaRow = (item, idx) => ({
  id: item._id || idx,
  name: item.name || 'N/A',
  email: item.email || '',
  title: item.title || 'N/A',
  startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '-',
  endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '-',
  daysLeft: typeof item.daysLeft === 'number' ? item.daysLeft : 9999,
  nextStep: item.nextStep || 'Review Documents',
  action: 'Send Reminder',
  reviewStatus: item.reviewStatus || 'pending',
});

export const fetchHRApplications = createAsyncThunk('hr/fetchApplications', async () => {
  const response = await getHRApplications();
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(mapApplication);
});

export const fetchHRProfiles = createAsyncThunk('hr/fetchProfiles', async (search = '') => {
  const response = await getHRProfiles(search);
  return Array.isArray(response.data) ? response.data : [];
});

export const fetchHRVisaRows = createAsyncThunk('hr/fetchVisaRows', async () => {
  const response = await getHRVisaAll();
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map(mapVisaRow);
});

export const fetchHRApplicationDetail = createAsyncThunk('hr/fetchApplicationDetail', async (userId) => {
  const response = await getHRApplicationDetail(userId);
  return response.data || null;
});

export const reviewHRApplicationThunk = createAsyncThunk(
  'hr/reviewApplication',
  async ({ userId, status, feedback = '' }) => {
    await reviewHRApplication({ userId, status, feedback });
    return { userId, status, feedback };
  }
);

export const sendHRVisaReminderThunk = createAsyncThunk('hr/sendVisaReminder', async (payload) => {
  await sendHRVisaNotification(payload);
  return payload;
});

const initialState = {
  applications: [],
  applicationsLoading: false,
  profiles: [],
  profilesLoading: false,
  visaRows: [],
  visaLoading: false,
  applicationDetail: null,
  applicationDetailLoading: false,
  actionLoading: false,
  error: '',
};

const hrSlice = createSlice({
  name: 'hr',
  initialState,
  reducers: {
    clearApplicationDetail(state) {
      state.applicationDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHRApplications.pending, (state) => {
        state.applicationsLoading = true;
      })
      .addCase(fetchHRApplications.fulfilled, (state, action) => {
        state.applicationsLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchHRApplications.rejected, (state, action) => {
        state.applicationsLoading = false;
        state.applications = [];
        state.error = action.error?.message || 'Failed to fetch applications';
      })
      .addCase(fetchHRProfiles.pending, (state) => {
        state.profilesLoading = true;
      })
      .addCase(fetchHRProfiles.fulfilled, (state, action) => {
        state.profilesLoading = false;
        state.profiles = action.payload;
      })
      .addCase(fetchHRProfiles.rejected, (state, action) => {
        state.profilesLoading = false;
        state.profiles = [];
        state.error = action.error?.message || 'Failed to fetch profiles';
      })
      .addCase(fetchHRVisaRows.pending, (state) => {
        state.visaLoading = true;
      })
      .addCase(fetchHRVisaRows.fulfilled, (state, action) => {
        state.visaLoading = false;
        state.visaRows = action.payload;
      })
      .addCase(fetchHRVisaRows.rejected, (state, action) => {
        state.visaLoading = false;
        state.visaRows = [];
        state.error = action.error?.message || 'Failed to fetch visa rows';
      })
      .addCase(fetchHRApplicationDetail.pending, (state) => {
        state.applicationDetailLoading = true;
      })
      .addCase(fetchHRApplicationDetail.fulfilled, (state, action) => {
        state.applicationDetailLoading = false;
        state.applicationDetail = action.payload;
      })
      .addCase(fetchHRApplicationDetail.rejected, (state, action) => {
        state.applicationDetailLoading = false;
        state.applicationDetail = null;
        state.error = action.error?.message || 'Failed to fetch application detail';
      })
      .addCase(reviewHRApplicationThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(reviewHRApplicationThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { userId, status, feedback } = action.payload;
        state.applications = state.applications.map((app) =>
          app.userId === userId
            ? { ...app, status, feedback: status === 'Rejected' ? feedback : app.feedback }
            : app
        );
      })
      .addCase(reviewHRApplicationThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.error?.message || 'Failed to review application';
      })
      .addCase(sendHRVisaReminderThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(sendHRVisaReminderThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(sendHRVisaReminderThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.error?.message || 'Failed to send reminder';
      });
  },
});

export const { clearApplicationDetail } = hrSlice.actions;
export default hrSlice.reducer;
