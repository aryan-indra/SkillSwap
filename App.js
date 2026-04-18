import React, { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from "@react-navigation/native";
import { Provider, useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './store/store';
import { ThemeProvider } from './contexts/ThemeContext';
import StackNavigator from "./navigation/StackNavigator";
import { auth } from './firebaseconfig';
import {
  clearAuthUser as clearAuthUserAction,
  initializeSkillsData,
  setAuthLoading,
  setAuthReady,
  setAuthUser,
  resetSkillsToDefault,
} from './store/userSlice';
import { clearAuthUser as clearStoredAuthUser, loadAuthUser, saveAuthUser } from './storage/authStorage';

function AppBootstrapper() {
  const dispatch = useDispatch();

  useEffect(() => {
    let isActive = true;
    let authSettled = false;
    const authFallbackTimer = setTimeout(() => {
      if (isActive && !authSettled) {
        dispatch(setAuthReady(true));
        dispatch(setAuthLoading(false));
      }
    }, 3000);

    void (async () => {
      try {
        const storedUser = await loadAuthUser();

        if (isActive && storedUser) {
          dispatch(setAuthUser(storedUser));
          await dispatch(initializeSkillsData(storedUser.uid));
        }
      } catch {
        if (isActive) {
          dispatch(resetSkillsToDefault());
          dispatch(setAuthReady(true));
          dispatch(setAuthLoading(false));
        }
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.providerData?.[0]?.displayName || '',
            email: firebaseUser.email || firebaseUser.providerData?.[0]?.email || '',
            photo: firebaseUser.photoURL || firebaseUser.providerData?.[0]?.photoURL || '',
          };

          dispatch(setAuthUser(profile));
          await dispatch(initializeSkillsData(profile.uid));
          await saveAuthUser(profile);
        } else {
          dispatch(clearAuthUserAction());
          dispatch(resetSkillsToDefault());
          await clearStoredAuthUser();
        }
      } catch (error) {
        dispatch(setAuthLoading(false));
      } finally {
        if (isActive) {
          authSettled = true;
          clearTimeout(authFallbackTimer);
          dispatch(setAuthReady(true));
          dispatch(setAuthLoading(false));
        }
      }
    });

    return () => {
      isActive = false;
      authSettled = true;
      clearTimeout(authFallbackTimer);
      unsubscribe();
    };
  }, [dispatch]);

  return <StackNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ThemeProvider>
            <NavigationContainer>
              <AppBootstrapper />
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
