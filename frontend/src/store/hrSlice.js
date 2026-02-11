import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getHRApplications,
  getHRApplicationDetail,
  getHRProfiles,
  getHRVisaAll,
  reviewHRVisaDocument,
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
  firstName: item.firstName || '',
  lastName: item.lastName || '',
  preferredName: item.preferredName || '',
  email: item.email || '',
  title: item.title || 'N/A',
  startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '-',
  endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '-',
  daysLeft: typeof item.daysLeft === 'number' ? item.daysLeft : 9999,
  nextStep: item.nextStep || 'Review Documents',
  inProgress: Boolean(item.inProgress),
  actionType: item.actionType || 'notify',
  pendingReviewDoc: item.pendingReviewDoc || null,
  approvedDocuments: Array.isArray(item.approvedDocuments) ? item.approvedDocuments : [],
});

const DEFAULT_PROFILES_META = {
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
};

const DEFAULT_PROFILES_STATS = {
  totalEmployees: 0,
  citizens: 0,
  nonCitizens: 0,
};

export const fetchHRApplications = createAsyncThunk('hr/fetchApplications', async () => {
  const response = await getHRApplications();
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(mapApplication);
});

export const fetchHRProfiles = createAsyncThunk('hr/fetchProfiles', async (query = {}) => {
  const normalizedQuery = typeof query === 'string' ? { search: query } : query;
  const response = await getHRProfiles(normalizedQuery);

  // Backward compatible with old API that returned a plain array.
  if (Array.isArray(response.data)) {
    const stats = response.data.reduce(
      (acc, employee) => {
        acc.totalEmployees += 1;
        if (employee?.title === 'Citizen' || employee?.title === 'Green Card') {
          acc.citizens += 1;
        } else {
          acc.nonCitizens += 1;
        }
        return acc;
      },
      { ...DEFAULT_PROFILES_STATS }
    );
    return {
      items: response.data,
      pagination: {
        ...DEFAULT_PROFILES_META,
        total: response.data.length,
        totalPages: response.data.length > 0 ? 1 : 0,
      },
      stats,
    };
  }

  return {
    items: Array.isArray(response.data?.items) ? response.data.items : [],
    pagination: {
      ...DEFAULT_PROFILES_META,
      ...(response.data?.pagination || {}),
    },
    stats: {
      ...DEFAULT_PROFILES_STATS,
      ...(response.data?.stats || {}),
    },
  };
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

export const reviewHRVisaDocumentThunk = createAsyncThunk(
  'hr/reviewVisaDocument',
  async ({ userId, docId, status, feedback = '' }) => {
    await reviewHRVisaDocument({ userId, docId, status, feedback });
    return { userId, docId, status, feedback };
  }
);

const initialState = {
  applications: [],
  applicationsLoading: false,
  profiles: [],
  profilesLoading: false,
  profilesMeta: { ...DEFAULT_PROFILES_META },
  profilesStats: { ...DEFAULT_PROFILES_STATS },
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
        state.profiles = action.payload.items;
        state.profilesMeta = action.payload.pagination;
        state.profilesStats = action.payload.stats;
      })
      .addCase(fetchHRProfiles.rejected, (state, action) => {
        state.profilesLoading = false;
        state.profiles = [];
        state.profilesMeta = { ...DEFAULT_PROFILES_META };
        state.profilesStats = { ...DEFAULT_PROFILES_STATS };
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
      })
      .addCase(reviewHRVisaDocumentThunk.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(reviewHRVisaDocumentThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(reviewHRVisaDocumentThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.error?.message || 'Failed to review visa document';
      });
  },
});

export const { clearApplicationDetail } = hrSlice.actions;
export default hrSlice.reducer;
