import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import Motion from '../components/motion';
import { createReview } from '../services/firestoreService';
import { showError, showSuccess } from '../utils/notify';

export default function ReviewScreen({ route, navigation }) {
  const mentor = route?.params?.mentor;
  const bookingId = route?.params?.bookingId;
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = useSelector((state) => state.user.user?.uid);
  const { theme, colors } = useTheme();

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showError("Rating required", "Please select a star rating before submitting.");
      return;
    }

    if (!mentor) {
      showError("Missing mentor", "Unable to submit review because mentor details are missing.");
      return;
    }

    try {
      setIsSubmitting(true);
      const trimmedText = reviewText.trim();
      await createReview({
        bookingId: bookingId || null,
        mentor,
        rating,
        reviewText: trimmedText,
        reviewerUid: userId,
      });
      showSuccess("Review submitted", `Thanks for reviewing ${mentor}.`);
      navigation.goBack();
    } catch {
      showError("Unable to save review", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Motion
        as="touchable"
        key={star}
        onPress={() => setRating(star)}
        style={styles.star}
        variant="scale"
        delay={star * 40}
        activeOpacity={0.8}
      >
        <Text style={[styles.starText, rating >= star && styles.starSelected]}>
          ★
        </Text>
      </Motion>
    ));
  };

  return (
    <View style={{ ...styles.container, backgroundColor: colors.background }}>
      <Motion variant="fadeSlide">
        <Text style={{ ...styles.title, color: colors.primaryText }}>Review Your Session</Text>
      </Motion>

      <Motion style={{ ...styles.mentorCard, backgroundColor: colors.card }} variant="scale" delay={80}>
        <Text style={{ ...styles.mentorName, color: colors.primaryText }}>{mentor}</Text>
        <Text style={{ ...styles.sessionText, color: colors.secondaryText }}>Session completed</Text>
      </Motion>

      <Motion
        style={theme === 'dark' ? { ...styles.ratingSection, backgroundColor: '#2a2a2a' } : styles.ratingSection}
        variant="fadeSlide"
        delay={140}
      >
        <Text style={{ ...styles.sectionTitle, color: theme === 'dark' ? '#e0e0e0' : '#333' }}>Rate your experience</Text>
        <View style={styles.starsContainer}>
          {renderStars()}
        </View>
        <Text style={styles.ratingText}>
          {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Tap to rate'}
        </Text>
      </Motion>

      <Motion
        style={theme === 'dark' ? styles.darkReviewSection : styles.reviewSection}
        variant="slide"
        delay={200}
      >
        <Text style={styles.sectionTitle}>Write a review (optional)</Text>
        <TextInput
          style={theme === 'dark' ? styles.darkReviewInput : styles.reviewInput}
          placeholder="Share your experience with this mentor..."
          placeholderTextColor={theme === 'dark' ? '#999' : '#ccc'}
          multiline
          numberOfLines={4}
          value={reviewText}
          onChangeText={setReviewText}
          textAlignVertical="top"
        />
      </Motion>

      <Motion
        as="touchable"
        style={[styles.submitButton, (rating === 0 || isSubmitting) && styles.submitButtonDisabled]}
        onPress={handleSubmitReview}
        disabled={rating === 0 || isSubmitting}
        variant="scale"
        delay={260}
        activeOpacity={0.85}
      >
        <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</Text>
      </Motion>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  darkTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#e0e0e0',
  },
  mentorCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkMentorCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mentorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  darkMentorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 5,
  },
  sessionText: {
    fontSize: 14,
    color: '#666',
  },
  darkSessionText: {
    fontSize: 14,
    color: '#b0b0b0',
  },
  ratingSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    marginHorizontal: 5,
  },
  starText: {
    fontSize: 40,
    color: '#ddd',
  },
  starSelected: {
    color: '#ffa500',
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
  },
  reviewSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkReviewSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  darkReviewInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#333',
    color: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
