import AsyncStorage from '@react-native-async-storage/async-storage';

const getReviewsStorageKey = (userId) => {
  const normalizedUserId = typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : 'guest';
  return `skillbridge.reviews.v1.${normalizedUserId}`;
};

export const loadReviews = async (userId) => {
  const rawReviews = await AsyncStorage.getItem(getReviewsStorageKey(userId));
  if (!rawReviews) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawReviews);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveReview = async (userId, review) => {
  const existingReviews = await loadReviews(userId);
  const updatedReviews = [review, ...existingReviews];
  await AsyncStorage.setItem(getReviewsStorageKey(userId), JSON.stringify(updatedReviews));
  return updatedReviews;
};
