import React, { useCallback, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { fetchSkillsFromApi } from '../store/userSlice';
import Motion from '../components/motion';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const skills = useSelector((state) => state.user.communitySkills || []);
  const isFetchingSkills = useSelector((state) => state.user.isFetchingSkills);
  const skillsError = useSelector((state) => state.user.skillsError);
  const offeredSkills = skills.filter((skill) => skill.type === 'offer');

  const syncSkills = useCallback(() => {
    dispatch(fetchSkillsFromApi());
  }, [dispatch]);

  useEffect(() => {
    syncSkills();
  }, [syncSkills]);

  const renderSkill = ({ item, index }) => (
    <Motion
      as="touchable"
      style={[styles.skillCard, { backgroundColor: colors.card, borderColor: colors.muted }]}
      onPress={() => navigation.navigate('Matches')}
      activeOpacity={0.85}
      variant="slide"
      delay={index * 70}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.skillName, { color: colors.primaryText }]}>{item.title}</Text>
        <Text style={[styles.skillHint, { color: colors.secondaryText }]}>Tap to view</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.secondaryText }]}>›</Text>
    </Motion>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Motion style={styles.headerSection} variant="fadeSlide">
        <Text style={[styles.title, { color: colors.primaryText }]}>Explore</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Available skills in your community</Text>
        <Motion
          as="touchable"
          style={[styles.syncButton, { borderColor: colors.muted, backgroundColor: colors.card }]}
          onPress={syncSkills}
          disabled={isFetchingSkills}
          activeOpacity={0.85}
          variant="scale"
          delay={80}
        >
          <Text style={[styles.syncButtonText, { color: colors.primaryText }]}>
            {isFetchingSkills ? 'Syncing...' : 'Sync from API'}
          </Text>
        </Motion>
        {skillsError ? (
          <Text style={styles.errorText}>{skillsError}</Text>
        ) : null}
      </Motion>

      <FlatList
        data={offeredSkills}
        renderItem={renderSkill}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingSkills}
            onRefresh={syncSkills}
            tintColor={colors.primaryText}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No skills available yet</Text>
          </View>
        }
      />
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
  syncButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 10,
    color: '#ef4444',
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  skillCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  skillHint: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 26,
    fontWeight: '300',
    marginLeft: 12,
  },
  emptyWrap: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
