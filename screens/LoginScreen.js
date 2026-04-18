import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import Motion from '../components/motion';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signInWithGoogle, authLoading, authError, isRequestReady } = useAuth();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Motion style={styles.content} variant="fadeSlide">
        <Motion style={styles.logoContainer} variant="scale" delay={90}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>✨</Text>
          </View>
        </Motion>

        <Motion variant="fade" delay={170}>
          <Text style={[styles.title, { color: colors.primaryText }]}>SkillSwap</Text>
        </Motion>
        <Motion variant="fadeSlide" delay={220}>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Sign in with Google to sync your skills, bookings, and profile.</Text>
        </Motion>

        <Motion
          as="touchable"
          style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.muted }]}
          onPress={signInWithGoogle}
          disabled={authLoading || !isRequestReady}
          activeOpacity={0.85}
          variant="scale"
          delay={300}
        >
          {authLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.accent} style={styles.googleLoader} />
              <Text style={[styles.googleButtonText, { color: colors.primaryText }]}>Signing in...</Text>
            </>
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleButtonText, { color: colors.primaryText }]}>Continue with Google</Text>
            </>
          )}
        </Motion>

        {authError ? (
          <Motion variant="fade" delay={360}>
            <Text style={styles.errorText}>{authError}</Text>
          </Motion>
        ) : null}

        {!isRequestReady ? (
          <Motion variant="fade" delay={400}>
            <Text style={[styles.helperText, { color: colors.secondaryText }]}>Set your Google OAuth client IDs to enable sign-in.</Text>
          </Motion>
        ) : null}

        <Motion style={styles.footer} variant="slide" delay={460}>
          <Text style={[styles.footerText, { color: colors.secondaryText }]}>Firebase Authentication keeps the session persisted with AsyncStorage.</Text>
        </Motion>
      </Motion>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#5b21b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 38,
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 44,
    paddingHorizontal: 20,
  },
  googleButton: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
    fontWeight: 'bold',
    color: '#ea4335',
  },
  googleLoader: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 10,
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  helperText: {
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
