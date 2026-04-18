import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEY = 'skillbridge.auth.profile.v1';

const normalizeAuthUser = (user) => ({
  uid: user?.uid || '',
  name: user?.name || '',
  email: user?.email || '',
  photo: user?.photo || user?.photoURL || '',
});

export const saveAuthUser = async (user) => {
  if (!user) {
    return;
  }

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizeAuthUser(user)));
};

export const loadAuthUser = async () => {
  const rawUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);

    if (!parsedUser || typeof parsedUser !== 'object') {
      return null;
    }

    return normalizeAuthUser(parsedUser);
  } catch {
    return null;
  }
};

export const clearAuthUser = async () => {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
};