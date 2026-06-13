import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DailyChatScreen from './src/screens/DailyChatScreen';
import PersonaHistoryScreen from './src/screens/PersonaHistoryScreen';
import SuggestionDetailsScreen from './src/screens/SuggestionDetailsScreen';
import SelectPersonaScreen from './src/screens/SelectPersonaScreen';
import FeedbackPOCScreen from './src/screens/FeedbackPOCScreen';
import PersonaDashboardScreen from './src/screens/PersonaDashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'BEQV' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: 'Criar Gêmeo Digital' }} />
        <Stack.Screen name="PersonaDashboard" component={PersonaDashboardScreen} options={{ title: 'Painel da Persona' }} />
        <Stack.Screen name="DailyChat" component={DailyChatScreen} options={{ title: 'Interação Diária' }} />
        <Stack.Screen name="PersonaHistory" component={PersonaHistoryScreen} options={{ title: 'Meu Gêmeo Digital' }} />
        <Stack.Screen name="SuggestionDetails" component={SuggestionDetailsScreen} options={{ title: 'Transparência IA' }} />
        <Stack.Screen name="SelectPersona" component={SelectPersonaScreen} options={{ title: 'Selecionar Persona' }} />
        <Stack.Screen name="FeedbackPOC" component={FeedbackPOCScreen} options={{ title: 'Avaliar POC' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}