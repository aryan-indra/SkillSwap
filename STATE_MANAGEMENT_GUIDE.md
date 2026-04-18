# State Management Implementation Guide

This guide explains the state management architecture implemented in the SkillBridge app, including Redux, Context API, and useReducer patterns.

## ✅ Fixed Issues

### 1. **store.js** - Removed TypeScript Syntax
- **Issue**: TypeScript `export type` statements were causing syntax errors in a JavaScript project
- **Fix**: Removed TypeScript type definitions
- **Result**: File now pure JavaScript compatible

### 2. **ProfileScreen.js** - Removed Duplicate Code
- **Issue**: Header section had duplicate view components rendering duplicate data
- **Fix**: Removed duplicate avatar, name, email, and joinedDate components
- **Result**: Clean, single header rendering

---

## Implementation Overview

### 1. Redux State Management

#### Store Setup (`store/store.js`)
```javascript
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});
```

#### User Slice (`store/userSlice.js`)
Contains actions and reducers for user authentication:
- **login(email, name)**: Updates login state and stores user data
- **logout()**: Clears user data and authentication state
- **addBooking(booking)**: Adds new booking to user's bookings array
- **updateBookingStatus(id, status)**: Updates booking lifecycle state

Bookings are initialized in Redux state and consumed directly by booking tabs.

#### Redux in Components

**LoginScreen.js**:
```javascript
const dispatch = useDispatch();
dispatch(login({ email, name: 'Demo User' }));
```

**ProfileScreen.js**:
```javascript
const user = useSelector(state => state.user.user);
const handleLogout = () => {
  dispatch(logout());
  navigation.replace("Login");
};
```

---

### 2. Context API for Theme Management

#### ThemeContext (`contexts/ThemeContext.js`)
```javascript
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

#### Context consumption in ProfileScreen:
```javascript
const { theme, toggleTheme } = useTheme();
const containerStyle = theme === 'dark' ? styles.darkContainer : styles.container;
```

Theme context is also consumed in `LoginScreen`, `HomeScreen`, `BookingScreen`, `ChatScreen`, `MatchScreen`, and `ReviewScreen` for shared palette-driven UI.

---

### 3. useReducer Hook for Complex State

#### HomeScreen Implementation
Complex state management for skill selection using useReducer:

```javascript
const selectedSkillsReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SELECT':
      const isSelected = state.selected.includes(action.payload);
      return {
        ...state,
        selected: isSelected
          ? state.selected.filter(id => id !== action.payload)
          : [...state.selected, action.payload],
      };
    case 'CLEAR_SELECTION':
      return { ...state, selected: [] };
    default:
      return state;
  }
};

// Usage
const [state, dispatch] = useReducer(selectedSkillsReducer, { selected: [] });

dispatch({ type: 'TOGGLE_SELECT', payload: item.id });
dispatch({ type: 'CLEAR_SELECTION' });
```

---

## App.js Provider Setup

All providers are wrapped in proper order:

```javascript
<Provider store={store}>           {/* Redux Provider - top level */}
  <ThemeProvider>                   {/* Context Provider */}
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  </ThemeProvider>
</Provider>
```

---

## State Management Patterns in Each Screen

### LoginScreen
- **Local State**: email, password (useState)
- **Redux**: Dispatches login action on successful authentication
- **Context**: None

### HomeScreen
- **Local State**: None (all in reducer)
- **Reducer**: Selected skills management
- **Redux**: None
- **Context**: None

### ProfileScreen
- **Local State**: None
- **Redux**: Access user state via useSelector
- **Context**: Theme for styling
- **Actions**: Logout dispatch

### BookingScreen, ChatScreen, MatchScreen, ReviewScreen
- **Local State**: Various (useState for forms)
- **Redux**: BookingScreen reads bookings via `useSelector` and adds new bookings via `dispatch(addBooking())`
- **Context**: Theme context consumed for shared colors/style in all listed screens

---

## Redux Flow Diagram

```
User Action (Login Form)
        ↓
   dispatch(login())
        ↓
    Reducer processes
        ↓
   Store updated
        ↓
useSelector gets data
        ↓
Component re-renders
```

---

## Context API Flow Diagram

```
ThemeProvider wraps app
        ↓
  useTheme() hook
        ↓
theme state available
        ↓
toggleTheme() called
        ↓
All consumers re-render
```

---

## useReducer Flow Diagram

```
User taps skill card
        ↓
   dispatch action
        ↓
Reducer evaluates
        ↓
New state returned
        ↓
Component re-renders
```

---

## File Structure

```
exp3/
├── App.js (Redux & Context setup)
├── store/
│   ├── store.js (Redux store configuration)
│   └── userSlice.js (User reducer & actions)
├── contexts/
│   └── ThemeContext.js (Theme context provider)
├── screens/
│   ├── LoginScreen.js (Redux dispatch)
│   ├── HomeScreen.js (useReducer)
│   ├── ProfileScreen.js (Redux consume + Context)
│   ├── BookingScreen.js
│   ├── ChatScreen.js
│   ├── MatchScreen.js
│   └── ReviewScreen.js
└── navigation/
    ├── StackNavigator.js
    ├── DrawerNavigator.js
    └── TabNavigator.js
```

---

## Best Practices Implemented

✅ **Redux for Global State**: User authentication (persists across screens)
✅ **Context for Shared UI State**: Theme (affects multiple consumers)
✅ **useReducer for Complex Local State**: Skill selection with toggle logic
✅ **Custom Hooks**: useTheme() for clean context consumption
✅ **Proper Provider Nesting**: Top-level Redux, then Context
✅ **Immutable Updates**: Reducers return new state objects
✅ **Type Safety**: Clear action types (even in JavaScript)

---

## Testing the Implementation

1. **Redux Login**:
   - Login on LoginScreen
   - Check ProfileScreen shows logged-in user email
   - Logout and verify state clears

2. **Context Theme**:
   - Toggle theme on ProfileScreen
   - Verify colors change
   - Navigate to other screens and back

3. **useReducer Selection**:
   - Click skills on HomeScreen
   - Click "Clear Selection" button
   - Verify selection state persists within screen

---

## Potential Enhancements

- Persist Redux state to AsyncStorage
- Add Redux middleware for side effects (redux-thunk/saga)
- Add theme persistence to Context
- Expand reducer to handle more complex flows
- Add Redux DevTools for debugging
- Implement loading states in Redux
- Add error handling to all actions
