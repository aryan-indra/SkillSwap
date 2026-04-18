import React from "react";
import { Alert, ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from '../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { removeSkillAndPersist } from '../store/userSlice';
import Motion from '../components/motion';

const showError = (title, message) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export default function ProfileScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const { user, logout, authLoading } = useAuth();
  const dispatch = useDispatch();
  const skills = useSelector(state => state.user.skills || []);

  const offeredSkills = skills.filter((skill) => skill.type === 'offer');
  const wantedSkills = skills.filter((skill) => skill.type === 'want');

  const userName = user?.name || 'Google User';
  const userEmail = user?.email || 'No email available';
  const userId = user?.uid ? user.uid.slice(0, 8).toUpperCase() : 'SKL-2847';
  const userPhoto = user?.photo || '';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    void (async () => {
      try {
        await logout();
      } catch {
        showError('Unable to sign out', 'Please try again.');
      }
    })();
  };

  const handleRemoveSkill = (skill) => {
    void (async () => {
      try {
        await dispatch(removeSkillAndPersist({ skillId: skill.id })).unwrap();
      } catch {
        showError('Unable to remove skill', 'Please try again.');
      }
    })();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <Motion style={styles.userInfoRow} variant="fadeSlide">
          <Motion style={styles.avatar} variant="scale" delay={60}>
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </Motion>

          <View style={styles.userInfoText}>
            <Text style={[styles.userName, { color: colors.primaryText }]}>{userName}</Text>
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>{userEmail}</Text>
            <Text style={[styles.userId, { color: colors.secondaryText }]}>{userId}</Text>
          </View>

          <View style={styles.iconButtonsWrap}>
            <Motion
              as="touchable"
              style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.muted }]}
              onPress={toggleTheme}
              activeOpacity={0.85}
              variant="scale"
              delay={120}
            >
              <Text style={[styles.iconText, { color: colors.secondaryText }]}>{theme === 'light' ? '☾' : '☼'}</Text>
            </Motion>
          </View>
        </Motion>

        <Motion style={styles.statsRow} variant="slide" delay={120}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primaryText }]}>{skills.length}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primaryText }]}>{offeredSkills.length}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Offering</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primaryText }]}>{wantedSkills.length}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Wanting</Text>
          </View>
        </Motion>

        <Motion
          as="touchable"
          style={[
            styles.logoutAction,
            { backgroundColor: colors.card, borderColor: '#ef4444' },
            authLoading && styles.logoutActionDisabled,
          ]}
          onPress={handleLogout}
          disabled={authLoading}
          activeOpacity={0.85}
          variant="scale"
          delay={180}
        >
          {authLoading ? (
            <>
              <ActivityIndicator size="small" color="#ef4444" />
              <Text style={[styles.logoutActionText, { color: '#ef4444' }]}>Signing out...</Text>
            </>
          ) : (
            <Text style={[styles.logoutActionText, { color: '#ef4444' }]}>Log Out</Text>
          )}
        </Motion>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.muted }]} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>SKILLS I OFFER ({offeredSkills.length})</Text>
          <View style={styles.chipsWrap}>
            {offeredSkills.length ? (
              offeredSkills.map((skill, index) => (
                <Motion key={skill.id} style={[styles.offerChip, styles.skillChip]} variant="slide" delay={index * 70}>
                  <Text style={styles.offerChipText}>{skill.title}</Text>
                  <Motion
                    as="touchable"
                    style={styles.offerRemoveButton}
                    onPress={() => handleRemoveSkill(skill)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${skill.title}`}
                    activeOpacity={0.85}
                    variant="scale"
                    delay={80}
                  >
                    <Text style={styles.offerRemoveButtonText}>Remove</Text>
                  </Motion>
                </Motion>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No skills offered yet</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>SKILLS I WANT ({wantedSkills.length})</Text>
          <View style={styles.chipsWrap}>
            {wantedSkills.length ? (
              wantedSkills.map((skill, index) => (
                <Motion key={skill.id} style={[styles.wantChip, { backgroundColor: colors.card, borderColor: colors.muted }, styles.skillChip]} variant="slide" delay={index * 70}>
                  <Text style={[styles.wantChipText, { color: colors.primaryText }]}>{skill.title}</Text>
                  <Motion
                    as="touchable"
                    style={[styles.wantRemoveButton, { backgroundColor: colors.background, borderColor: colors.muted }]}
                    onPress={() => handleRemoveSkill(skill)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${skill.title}`}
                    activeOpacity={0.85}
                    variant="scale"
                    delay={80}
                  >
                    <Text style={[styles.wantRemoveButtonText, { color: colors.secondaryText }]}>Remove</Text>
                  </Motion>
                </Motion>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No skills wanted yet</Text>
            )}
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 24,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5b21b6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  userInfoText: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userId: {
    fontSize: 14,
    marginTop: 2,
  },
  iconButtonsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  logoutIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
  },
  logoutAction: {
    marginTop: 18,
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutActionDisabled: {
    opacity: 0.7,
  },
  logoutActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
  },
  divider: {
    height: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 28,
  },
  section: {},
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offerChip: {
    backgroundColor: '#5b21b6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offerChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  offerRemoveButton: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  offerRemoveButtonText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  wantChip: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  wantChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  wantRemoveButton: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  wantRemoveButtonText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 4,
  },
});
