import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSkillsFromDb, initSkillsTable, replaceSkillsInDb } from '../storage/skillsDb';

const legacyDefaultSkills = [
  { title: 'Web Design', type: 'offer' },
  { title: 'Photography', type: 'offer' },
  { title: 'Spanish Language', type: 'want' },
  { title: 'Graphic Design', type: 'offer' },
  { title: 'Video Editing', type: 'want' },
  { title: 'Public Speaking', type: 'offer' },
  { title: 'Italian Cooking', type: 'want' },
  { title: 'UI/UX Design', type: 'offer' },
  { title: 'Guitar Playing', type: 'want' },
];

const legacyDefaultSkillSignatures = new Set(
  legacyDefaultSkills.map((skill) => `${skill.title.toLowerCase()}::${skill.type}`)
);

const isApiSkill = (skill) => typeof skill?.id === 'string' && skill.id.startsWith('api-');

const normalizeSkillSignature = (skill) => {
  const title = typeof skill?.title === 'string' ? skill.title.trim().toLowerCase() : '';
  const type = typeof skill?.type === 'string' ? skill.type.trim().toLowerCase() : '';
  return `${title}::${type}`;
};

const stripLegacyDefaultSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills.filter((skill) => !legacyDefaultSkillSignatures.has(normalizeSkillSignature(skill)));
};

const getResolvedUserId = (state, userId) => {
  if (typeof userId === 'string' && userId.trim().length > 0) {
    return userId.trim();
  }

  const activeUserId = state?.user?.user?.uid;
  return typeof activeUserId === 'string' && activeUserId.trim().length > 0 ? activeUserId.trim() : null;
};

const initialBookings = [
  {
    id: '1',
    mentor: 'Alice Johnson',
    skill: 'Python',
    date: '2024-02-25',
    time: '3:00 PM',
    status: 'confirmed',
    duration: '1 hour',
  },
  {
    id: '2',
    mentor: 'Bob Smith',
    skill: 'JavaScript',
    date: '2024-02-26',
    time: '2:00 PM',
    status: 'pending',
    duration: '45 minutes',
  },
  {
    id: '3',
    mentor: 'Charlie Brown',
    skill: 'React Native',
    date: '2024-02-20',
    time: '4:00 PM',
    status: 'completed',
    duration: '1 hour',
  },
  {
    id: '4',
    mentor: 'Diana Prince',
    skill: 'Machine Learning',
    date: '2024-02-15',
    time: '1:00 PM',
    status: 'cancelled',
    duration: '1.5 hours',
  },
];

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

const persistSkills = async (skills, userId) => {
  if (!userId) {
    return;
  }

  await replaceSkillsInDb(skills, userId);
};

export const initializeSkillsData = createAsyncThunk('user/initializeSkillsData', async (userId, { getState, rejectWithValue }) => {
  try {
    await initSkillsTable();

    const resolvedUserId = getResolvedUserId(getState(), userId);
    if (!resolvedUserId) {
      return [];
    }

    const dbSkills = await getSkillsFromDb(resolvedUserId);
    if (dbSkills !== null) {
      const cleanedSkills = stripLegacyDefaultSkills(dbSkills).filter((skill) => !isApiSkill(skill));

      if (cleanedSkills.length !== dbSkills.length) {
        await persistSkills(cleanedSkills, resolvedUserId);
      }

      return cleanedSkills;
    }

    return [];
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to load skills');
  }
});

export const fetchSkillsFromApi = createAsyncThunk(
  'user/fetchSkillsFromApi',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const users = await response.json();

      const apiSkills = users.slice(0, 6).map((user) => ({
        id: `api-${user.id}`,
        title: `${user.company?.bs || 'Mentorship'} (${user.username})`,
        type: 'offer',
      }));

      return apiSkills;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to fetch skills from API');
    }
  }
);

export const addSkillAndPersist = createAsyncThunk(
  'user/addSkillAndPersist',
  async ({ title, type }, { getState, rejectWithValue }) => {
    try {
      const newSkill = {
        id: Date.now().toString(),
        title,
        type,
      };

      const skills = getState().user.skills || [];
      const updatedSkills = [...skills, newSkill];
      const currentUserId = getResolvedUserId(getState());
      await persistSkills(updatedSkills, currentUserId);

      return newSkill;
    } catch (error) {
      return rejectWithValue(error.message || 'Unable to save the new skill');
    }
  }
);

export const removeSkillAndPersist = createAsyncThunk(
  'user/removeSkillAndPersist',
  async ({ skillId }, { getState, rejectWithValue }) => {
    try {
      const skills = getState().user.skills || [];
      const updatedSkills = skills.filter((skill) => skill.id !== skillId);
      const currentUserId = getResolvedUserId(getState());

      await persistSkills(updatedSkills, currentUserId);

      return updatedSkills;
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
        state.skills = action.payload;
      })
      .addCase(initializeSkillsData.rejected, (state, action) => {
        state.isHydratingSkills = false;
        state.skillsError = action.payload || action.error.message;
      })
      .addCase(fetchSkillsFromApi.pending, (state) => {
        state.isFetchingSkills = true;
        state.skillsError = null;
      })
      .addCase(fetchSkillsFromApi.fulfilled, (state, action) => {
        state.isFetchingSkills = false;
        state.communitySkills = action.payload;
      })
      .addCase(fetchSkillsFromApi.rejected, (state, action) => {
        state.isFetchingSkills = false;
        state.skillsError = action.payload || action.error.message;
      })
      .addCase(addSkillAndPersist.fulfilled, (state, action) => {
        state.skills.push(action.payload);
      })
      .addCase(addSkillAndPersist.rejected, (state, action) => {
        state.skillsError = action.payload || action.error.message;
      })
      .addCase(removeSkillAndPersist.pending, (state) => {
        state.skillsError = null;
      })
      .addCase(removeSkillAndPersist.fulfilled, (state, action) => {
        state.skills = action.payload;
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