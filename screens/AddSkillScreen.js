import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../contexts/ThemeContext';
import { addSkillAndPersist } from '../store/userSlice';
import Motion from '../components/motion';
import { showError, showSuccess } from '../utils/notify';

export default function AddSkillScreen({ navigation }) {
  const [skillType, setSkillType] = useState('offer');
  const [skillName, setSkillName] = useState('');
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const skills = useSelector((state) => state.user.skills || []);

  const handleAddSkill = async () => {
    const trimmed = skillName.trim();
    if (!trimmed) {
      showError('Skill name required', 'Please enter a skill name before submitting.');
      return;
    }

    const duplicateSkill = skills.some(
      (skill) => skill.type === skillType && skill.title.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicateSkill) {
      showError('Duplicate skill', `You already added "${trimmed}" in this category.`);
      return;
    }

    try {
      await dispatch(addSkillAndPersist({ title: trimmed, type: skillType })).unwrap();
      setSkillName('');
      showSuccess('Skill added', `"${trimmed}" was added to your profile.`);
      navigation.navigate('Profile');
    } catch {
      showError('Unable to add skill', 'Please try again.');
    }
  };

  return (
    <ScrollView style={{ ...styles.container, backgroundColor: colors.background }}>
      <Motion style={styles.headerSection} variant="fadeSlide">
        <Text style={{ ...styles.title, color: colors.primaryText }}>Add Skill</Text>
        <Text style={{ ...styles.subtitle, color: colors.secondaryText }}>Share what you offer or want to learn</Text>
      </Motion>

      <Motion style={styles.content} variant="slide" delay={80}>
        {/* Type Selector */}
        <View>
          <Text style={{ ...styles.label, color: colors.primaryText }}>Type</Text>
          <View style={styles.typeContainer}>
            <Motion
              as="touchable"
              style={[
                styles.typeButton,
                skillType === 'offer' && { ...styles.typeButtonActive, backgroundColor: colors.accent }
              ]}
              onPress={() => setSkillType('offer')}
              activeOpacity={0.85}
              variant="scale"
            >
              <Text style={[styles.typeButtonText, skillType === 'offer' && styles.typeButtonTextActive]}>
                I Offer
              </Text>
            </Motion>
            <Motion
              as="touchable"
              style={[
                styles.typeButton,
                skillType === 'want' && { ...styles.typeButtonActive, backgroundColor: colors.accent }
              ]}
              onPress={() => setSkillType('want')}
              activeOpacity={0.85}
              variant="scale"
              delay={60}
            >
              <Text style={[styles.typeButtonText, skillType === 'want' && styles.typeButtonTextActive]}>
                I Want
              </Text>
            </Motion>
          </View>
        </View>

        {/* Skill Name Input */}
        <View style={styles.inputSection}>
          <Text style={{ ...styles.label, color: colors.primaryText }}>Skill Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.primaryText,
                borderColor: colors.muted
              }
            ]}
            placeholder="e.g., Web Design, Photography..."
            placeholderTextColor={colors.placeholder}
            value={skillName}
            onChangeText={setSkillName}
          />
        </View>

        {/* Add Skill Button */}
        <Motion
          as="touchable"
          style={[styles.addButton, { backgroundColor: colors.accent }, !skillName.trim() && styles.addButtonDisabled]}
          onPress={handleAddSkill}
          disabled={!skillName.trim()}
          activeOpacity={0.85}
          variant="scale"
          delay={120}
        >
          <Text style={styles.addButtonText}>+ Add Skill</Text>
        </Motion>
      </Motion>
    </ScrollView>
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
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1a1d26',
    borderWidth: 1,
    borderColor: '#252831',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#5b21b6',
    borderColor: '#5b21b6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1a1d26',
    borderWidth: 1,
    borderColor: '#252831',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#5b21b6',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
