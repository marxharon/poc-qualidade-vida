import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function SuggestionDetailsScreen({ route, navigation }) {
  const { suggestion } = route.params || {};

  if (!suggestion) {
    return <View style={styles.container}><Text style={styles.label}>Nenhuma sugestão ativa no momento.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Transparência Preditiva da IA</Text>
      <Text style={styles.subtitle}>Entenda como o seu Gêmeo Digital processou sua interação para sugerir esta ação de melhoria.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🎯 Ação de Acolhimento Sugerida</Text>
        <Text style={styles.valueHighlight}>{suggestion.sugestao_acao}</Text>
        
        <View style={styles.divider} />

        <Text style={styles.label}>📌 Eixo ESG Vinculado:</Text>
        <Text style={styles.value}>{suggestion.eixo}</Text>
        
        <Text style={styles.label}>🧠 Motivo (Análise Vetorial):</Text>
        <Text style={styles.value}>O relato da sua interação diária alterou sua representação matemática no banco vetorial da empresa, aproximando seu Gêmeo Digital de um quadro de fadiga em relação aos demais perfis parecidos. A IA gerou esta sugestão preventivamente para blindar o seu bem-estar.</Text>

        <Text style={styles.label}>📈 Impacto Preditivo Esperado:</Text>
        <Text style={styles.value}>{suggestion.percentual_adesao}%</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Entendi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 20 },
  card: { padding: 20, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' },
  valueHighlight: { fontSize: 16, fontStyle: 'italic', color: '#1f2937', marginBottom: 16, lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  label: { fontWeight: 'bold', marginTop: 12, color: '#4b5563', fontSize: 13 },
  value: { fontSize: 14, color: '#374151', marginTop: 4, lineHeight: 22 },
  backButton: { backgroundColor: '#374151', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  backButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});