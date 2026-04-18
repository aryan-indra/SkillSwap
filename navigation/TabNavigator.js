import React from "react";
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import AddSkillScreen from "../screens/AddSkillScreen";
import MatchScreen from "../screens/MatchScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1d26',
          borderTopColor: '#252831',
          borderTopWidth: 1,
          paddingBottom: 10,
          paddingTop: 8,
          height: 74,
        },
        tabBarActiveTintColor: '#5b21b6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddSkillScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'add' : 'add-outline'} size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
