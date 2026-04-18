import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import TabNavigator from "./TabNavigator";
import ProfileScreen from "../screens/ProfileScreen";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen
        name="Dashboard"
        component={TabNavigator}
        options={{ title: "SkillBridge" }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Drawer.Navigator>
  );
}
