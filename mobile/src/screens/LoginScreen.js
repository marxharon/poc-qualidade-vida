import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plataforma BEQV</Text>
      <Text style={styles.subtitle}>Bem-estar e Qualidade de Vida</Text>
      <Button title="Entrar (Acesso Serpro)" onPress={() => navigation.navigate('Onboarding')} />
      <View style={{ marginTop: 20 }}>
        <Button title="Já tenho Persona (Ir para o Chat)" onPress={() => navigation.navigate('SelectPersona')} color="#28a745" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#0047AB' },
  subtitle: { fontSize: 16, marginBottom: 30, color: 'gray' },
});