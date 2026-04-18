import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from '../contexts/ThemeContext';
import Motion from '../components/motion';

export default function MatchScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Motion style={styles.headerSection} variant="fadeSlide">
        <Text style={[styles.title, { color: colors.primaryText }]}>Matches</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>People with complementary skills</Text>
      </Motion>

      <Motion style={styles.emptyStateContainer} variant="fadeScale" delay={120}>
        <Motion style={[styles.heartIcon, { backgroundColor: colors.card }]} variant="scale" delay={120}>
          <Text style={[styles.heartText, { color: colors.secondaryText }]}>♡</Text>
        </Motion>
        <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>No matches yet</Text>
        <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>Add skills to get matched with others</Text>
      </Motion>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartText: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
