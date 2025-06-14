import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab, IconSymbol } from "@/components/ui";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants";
import { useColorScheme } from "@/hooks";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="login"
        options={{
          title: "Login",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="login" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          title: "Register",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="register" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
