import AsyncStorage from '@react-native-async-storage/async-storage';

const SKILLS_STORAGE_KEY_PREFIX = 'skillbridge.skills.v2';
const LEGACY_SKILLS_STORAGE_KEY = 'skillbridge.skills.v1';

const getSkillsStorageKey = (userId) => {
  if (typeof userId !== 'string') {
    return null;
  }

  const trimmedUserId = userId.trim();
  return trimmedUserId.length > 0 ? `${SKILLS_STORAGE_KEY_PREFIX}.${trimmedUserId}` : null;
};

const parseSkills = (rawSkills) => {
  try {
    const parsedSkills = JSON.parse(rawSkills);
    return Array.isArray(parsedSkills) ? parsedSkills : [];
  } catch {
    return [];
  }
};

export const initSkillsTable = async () => {
  // AsyncStorage-backed persistence does not need schema setup.
};

export const replaceSkillsInDb = async (skills, userId) => {
  const storageKey = getSkillsStorageKey(userId);
  if (!storageKey) {
    return;
  }

  const safeSkills = Array.isArray(skills) ? skills : [];
  await AsyncStorage.setItem(storageKey, JSON.stringify(safeSkills));
};

export const getSkillsFromDb = async (userId) => {
  const storageKey = getSkillsStorageKey(userId);
  if (!storageKey) {
    return null;
  }

  const userSkills = await AsyncStorage.getItem(storageKey);
  if (userSkills !== null) {
    return parseSkills(userSkills);
  }

  const legacySkills = await AsyncStorage.getItem(LEGACY_SKILLS_STORAGE_KEY);
  if (legacySkills !== null) {
    const parsedLegacySkills = parseSkills(legacySkills);
    await AsyncStorage.setItem(storageKey, JSON.stringify(parsedLegacySkills));
    await AsyncStorage.removeItem(LEGACY_SKILLS_STORAGE_KEY);
    return parsedLegacySkills;
  }

  return null;
};
