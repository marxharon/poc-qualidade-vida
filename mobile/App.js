import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DailyChatScreen from './src/screens/DailyChatScreen';
import SuggestionDetailsScreen from './src/screens/SuggestionDetailsScreen';
import FeedbackPOCScreen from './src/screens/FeedbackPOCScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Configuração da Persona' }} />
        <Stack.Screen name="DailyChat" component={DailyChatScreen} options={{ title: 'Mentor de Bem-Estar', headerBackVisible: false }} />
        <Stack.Screen name="SuggestionDetails" component={SuggestionDetailsScreen} options={{ title: 'Detalhes da Sugestão' }} />
        <Stack.Screen name="FeedbackPOC" component={FeedbackPOCScreen} options={{ title: 'Avaliação Final' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}