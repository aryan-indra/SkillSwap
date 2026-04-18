import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSkill, fetchCommunitySkills, fetchUserSkills, removeSkill } from '../services/firestoreService';

const getResolvedUserId = (state, userId) => {
  if (typeof userId === 'string' && userId.trim().length > 0) {
    return userId.trim();
  }

  const activeUserId = state?.user?.user?.uid;
  return typeof activeUserId === 'string' && activeUserId.trim().length > 0 ? activeUserId.trim() : null;
};

const initialBookings = [];

const normalizeAuthUser = (user) => ({
  uid: user?.uid || '',
  name: user?.name || '',
  email: user?.email || '',
  photo: user?.photo || user?.photoURL || '',
});

const applySignedInUser = (state, user) => {
  if (!user) {
    applySignedOutUser(state);
    return;
  }

  state.isLoggedIn = true;
  state.user = normalizeAuthUser(user);
  state.authLoading = false;
  state.authError = null;
};

const applySignedOutUser = (state) => {
  state.isLoggedIn = false;
  state.user = null;
  state.authLoading = false;
  state.authError = null;
};

export const initializeSkillsData = createAsyncThunk('user/initializeSkillsData', async (userId, { getState, rejectWithValue }) => {
  try {
    const resolvedUserId = getResolvedUserId(getState(), userId);
    if (!resolvedUserId) {
      return { userSkills: [], communitySkills: [] };
    }

    const [userSkills, communitySkills] = await Promise.all([
      fetchUserSkills(resolvedUserId),
      fetchCommunitySkills(),
    ]);

    return { userSkills, communitySkills };
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load skills');
  }
});

export const refreshCommunitySkills = createAsyncThunk(
  'user/refreshCommunitySkills',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCommunitySkills();
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to refresh community skills');
    }
  }
);

export const addSkillAndPersist = createAsyncThunk(
  'user/addSkillAndPersist',
  async ({ title, type }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentUserId = getResolvedUserId(state);
      const ownerName = state?.user?.user?.name || state?.user?.user?.email || 'Unknown user';
      if (!currentUserId) {
        throw new Error('Missing authenticated user');
      }

      return await createSkill({ ownerUid: currentUserId, ownerName, title, type });
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to save the new skill');
    }
  }
);

export const removeSkillAndPersist = createAsyncThunk(
  'user/removeSkillAndPersist',
  async ({ skillId }, { getState, rejectWithValue }) => {
    try {
      const currentUserId = getResolvedUserId(getState());
      if (!currentUserId) {
        throw new Error('Missing authenticated user');
      }

      await removeSkill({ skillId, ownerUid: currentUserId });

      return skillId;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to remove the skill');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    isLoggedIn: false,
    user: null,
    authReady: false,
    authLoading: false,
    authError: null,
    bookings: initialBookings,
    skills: [],
    communitySkills: [],
    isHydratingSkills: false,
    isFetchingSkills: false,
    skillsError: null,
  },
  reducers: {
    login: (state, action) => {
      applySignedInUser(state, action.payload);
    },
    logout: (state) => {
      applySignedOutUser(state);
    },
    setAuthUser: (state, action) => {
      applySignedInUser(state, action.payload);
    },
    clearAuthUser: (state) => {
      applySignedOutUser(state);
    },
    resetSkillsToDefault: (state) => {
      state.skills = [];
      state.communitySkills = [];
      state.isHydratingSkills = false;
      state.isFetchingSkills = false;
      state.skillsError = null;
    },
    setAuthReady: (state, action) => {
      state.authReady = Boolean(action.payload);
    },
    setAuthLoading: (state, action) => {
      state.authLoading = Boolean(action.payload);
    },
    setAuthError: (state, action) => {
      state.authError = action.payload ?? null;
    },
    addBooking: (state, action) => {
      state.bookings.push(action.payload);
    },
    updateBookingStatus: (state, action) => {
      const { id, status } = action.payload;
      const booking = state.bookings.find((item) => item.id === id);
      if (booking) {
        booking.status = status;
      }
    },
    setSkills: (state, action) => {
      state.skills = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSkillsData.pending, (state) => {
        state.isHydratingSkills = true;
        state.skillsError = null;
      })
      .addCase(initializeSkillsData.fulfilled, (state, action) => {
        state.isHydratingSkills = false;
        state.skills = action.payload.userSkills;
        state.communitySkills = action.payload.communitySkills;
      })
      .addCase(initializeSkillsData.rejected, (state, action) => {
        state.isHydratingSkills = false;
        state.skillsError = action.payload || action.error.message;
      })
      .addCase(refreshCommunitySkills.pending, (state) => {
        state.isFetchingSkills = true;
        state.skillsError = null;
      })
      .addCase(refreshCommunitySkills.fulfilled, (state, action) => {
        state.isFetchingSkills = false;
        state.communitySkills = action.payload;
      })
      .addCase(refreshCommunitySkills.rejected, (state, action) => {
        state.isFetchingSkills = false;
        state.skillsError = action.payload || action.error.message;
      })
      .addCase(addSkillAndPersist.fulfilled, (state, action) => {
        state.skills.push(action.payload);
        state.communitySkills.push(action.payload);
      })
      .addCase(addSkillAndPersist.rejected, (state, action) => {
        state.skillsError = action.payload || action.error.message;
      })
      .addCase(removeSkillAndPersist.pending, (state) => {
        state.skillsError = null;
      })
      .addCase(removeSkillAndPersist.fulfilled, (state, action) => {
        const skillId = action.payload;
        state.skills = state.skills.filter((skill) => skill.id !== skillId);
        state.communitySkills = state.communitySkills.filter((skill) => skill.id !== skillId);
      })
      .addCase(removeSkillAndPersist.rejected, (state, action) => {
        state.skillsError = action.payload || action.error.message;
      });
  },
});

export const {
  login,
  logout,
  setAuthUser,
  clearAuthUser,
  resetSkillsToDefault,
  setAuthReady,
  setAuthLoading,
  setAuthError,
  addBooking,
  updateBookingStatus,
  setSkills,
} = userSlice.actions;
export default userSlice.reducer;