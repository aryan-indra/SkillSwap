# SkillSwap (Expo + Firebase)

SkillSwap is a React Native app (Expo) for sharing skills, browsing community offerings, tracking bookings, chatting, and leaving session reviews.

## Current Features

- Google authentication with Firebase
- Add/remove skills you offer or want
- Community skill feed sync
- Bookings tabs (upcoming, completed, cancelled)
- Review submission flow from completed bookings
- Local review persistence and display in profile
- Chat inbox tabs (all, unread, archived)
- Light/dark theme toggle

## Tech Stack

- Expo + React Native
- React Navigation (stack, bottom tabs, top tabs)
- Redux Toolkit + React Redux
- Firebase Authentication
- AsyncStorage for local persistence

## Prerequisites

- Node.js 18+
- npm
- Expo CLI (optional, `npx expo` works without global install)
- A Firebase project with Google sign-in enabled

## Install

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-expo-client-id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

At minimum, configure Expo + Web client IDs for development.

## Firebase Setup

1. Open Firebase Console and create/select your project.
2. Enable **Authentication > Sign-in method > Google**.
3. Add your app platforms (Web/Android/iOS) and copy OAuth client IDs.
4. Ensure your Firebase configuration in `firebaseconfig.base.js` matches your Firebase project.

## Run

```bash
# Start dev server
npm run start

# Run web
npm run web

# Run Android (native build flow)
npm run android

# Run iOS (native build flow; macOS only)
npm run ios
```

## Project Structure

- `App.js` - app bootstrap + auth hydration
- `navigation/` - stack/tab navigators
- `screens/` - app screens
- `store/` - Redux slices/store
- `storage/` - local persistence modules
- `hooks/` - app hooks, including auth logic

## Notes

- Reviews are currently stored locally via AsyncStorage.
- Bookings and chats are still prototype-level data flows and can be replaced with backend APIs later.
