import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';

import APIScreen from '../screens/APIScreen';
import FoodSecurityScreen from '../screens/FoodSecurityScreen';
import DMVScreen from '../screens/DMVScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e7ff', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#4A80F0',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tab.Screen
        name="API"
        component={APIScreen}
        options={{
          tabBarLabel: 'API',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="FoodSecurity"
        component={FoodSecurityScreen}
        options={{
          tabBarLabel: 'ESG / Food',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="DMV"
        component={DMVScreen}
        options={{
          tabBarLabel: 'DMV',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
