import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SuggestionDetailsScreen({ route }) {
  const { suggestion } = route.params || {};

  if (!suggestion) {
    return <View style={styles.container}><Text>Nenhuma sugestão ativa no momento.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Transparência da IA</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Ação Sugerida:</Text>
        <Text style={styles.value}>{suggestion.sugestao_acao}</Text>
        <Text style={styles.label}>Eixo de ESG Vinculado:</Text>
        <Text style={styles.value}>{suggestion.eixo}</Text>
        <Text style={styles.label}>Acurácia / Adesão Esperada:</Text>
        <Text style={styles.value}>{suggestion.percentual_adesao}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#0047AB' },
  card: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  label: { fontWeight: 'bold', marginTop: 10, color: '#555' },
  value: { fontSize: 16, marginBottom: 5, color: '#000' }
});