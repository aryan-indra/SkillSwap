import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signOut } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../firebaseconfig';
import { setAuthError, setAuthLoading } from '../store/userSlice';

WebBrowser.maybeCompleteAuthSession();

const normalizeClientId = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const configuredGoogleClientIds = {
  expoClientId: normalizeClientId(process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID),
  webClientId: normalizeClientId(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  iosClientId: normalizeClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  androidClientId: normalizeClientId(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
};

const authRequestFallbackClientId = 'placeholder-google-client-id';

const googleAuthConfig = {
  expoClientId:
    configuredGoogleClientIds.expoClientId ||
    configuredGoogleClientIds.webClientId ||
    authRequestFallbackClientId,
  webClientId:
    configuredGoogleClientIds.webClientId ||
    configuredGoogleClientIds.expoClientId ||
    authRequestFallbackClientId,
  iosClientId:
    configuredGoogleClientIds.iosClientId ||
    configuredGoogleClientIds.expoClientId ||
    authRequestFallbackClientId,
  androidClientId:
    configuredGoogleClientIds.androidClientId ||
    configuredGoogleClientIds.expoClientId ||
    authRequestFallbackClientId,
};

const hasConfiguredGoogleClientIds = Boolean(
  configuredGoogleClientIds.expoClientId ||
    configuredGoogleClientIds.webClientId ||
    configuredGoogleClientIds.iosClientId ||
    configuredGoogleClientIds.androidClientId
);

export function useAuth() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.user);
  const [request, response, promptAsync] = Google.useAuthRequest(googleAuthConfig);
  const isWebPlatform = Platform.OS === 'web';

  useEffect(() => {
    if (!response) {
      return;
    }

    const handleGoogleResponse = async () => {
      try {
        if (response.type === 'success') {
          const idToken = response.authentication?.idToken || response.params?.id_token || null;
          const accessToken = response.authentication?.accessToken || response.params?.access_token || null;

          if (!idToken && !accessToken) {
            throw new Error('Google sign-in did not return authentication tokens.');
          }

          const credential = GoogleAuthProvider.credential(idToken, accessToken);
          await signInWithCredential(auth, credential);
          dispatch(setAuthError(null));
        } else if (response.type === 'error') {
          dispatch(setAuthError(response.error?.message || 'Google sign-in failed.'));
        } else {
          dispatch(setAuthError(null));
        }
      } catch (error) {
        dispatch(setAuthError(error?.message || 'Unable to sign in with Google.'));
      } finally {
        dispatch(setAuthLoading(false));
      }
    };

    void handleGoogleResponse();
  }, [dispatch, response]);

  const signInWithGoogle = useCallback(async () => {
    if (isWebPlatform) {
      dispatch(setAuthError(null));
      dispatch(setAuthLoading(true));

      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
      } catch (error) {
        dispatch(setAuthError(error?.message || 'Unable to sign in with Google.'));
      } finally {
        dispatch(setAuthLoading(false));
      }

      return;
    }

    if (!hasConfiguredGoogleClientIds) {
      dispatch(setAuthError('Google Sign-In is not configured. Add your Expo and web client IDs.'));
      return;
    }

    if (!request) {
      dispatch(setAuthError('Google Sign-In is still loading. Please try again in a moment.'));
      return;
    }

    dispatch(setAuthError(null));
    dispatch(setAuthLoading(true));

    try {
      await promptAsync({ useProxy: true });
    } catch (error) {
      dispatch(setAuthError(error?.message || 'Unable to start Google sign-in.'));
      dispatch(setAuthLoading(false));
    }
  }, [dispatch, hasConfiguredGoogleClientIds, isWebPlatform, promptAsync, request]);

  const logout = useCallback(async () => {
    dispatch(setAuthError(null));
    dispatch(setAuthLoading(true));

    try {
      await signOut(auth);
      dispatch(setAuthLoading(false));
    } catch (error) {
      dispatch(setAuthError(error?.message || 'Unable to sign out.'));
      dispatch(setAuthLoading(false));
      throw error;
    }
  }, [dispatch]);

  return {
    user: authState.user,
    isLoggedIn: authState.isLoggedIn,
    authLoading: authState.authLoading,
    authError: authState.authError,
    isRequestReady: isWebPlatform || (hasConfiguredGoogleClientIds && Boolean(request)),
    signInWithGoogle,
    logout,
  };
}