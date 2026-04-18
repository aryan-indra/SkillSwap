import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from 'react-redux';
import LoginScreen from "../screens/LoginScreen";
import TabNavigator from "./TabNavigator";
import ReviewScreen from "../screens/ReviewScreen";
import ChatThreadScreen from "../screens/ChatThreadScreen";
import { useTheme } from "../contexts/ThemeContext";

const Stack = createNativeStackNavigator();

function AuthLoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.loadingTitle, { color: colors.primaryText }]}>Loading your account</Text>
      <Text style={[styles.loadingSubtitle, { color: colors.secondaryText }]}>Restoring Firebase session...</Text>
    </View>
  );
}

export default function StackNavigator() {
  const { authReady, isLoggedIn } = useSelector((state) => state.user);

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right"
      }}
    >
      {isLoggedIn ? (
        <Stack.Group navigationKey="signed-in" screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="ChatThread"
            component={ChatThreadScreen}
            options={{ animation: "slide_from_right" }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group navigationKey="signed-out" screenOptions={{ animation: 'fade' }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtitle: {
    fontSize: 14,
  },
});
