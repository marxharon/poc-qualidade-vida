import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function PersonaHistoryScreen({ route }) {
  const { id_persona } = route.params || {};
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/personas/${id_persona || 1}/history`)
      .then(res => { setHistory(res.data.history); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0047AB" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evolução e Interações Passadas</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id_interacao.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>{new Date(item.data_interacao).toLocaleDateString()}</Text>
            <Text style={styles.text}><Text style={styles.bold}>Você relatou:</Text> {item.resposta_colaborador}</Text>
            <Text style={styles.text}><Text style={styles.bold}>Sugestão da IA:</Text> {item.sugestao_ia}</Text>
            <Text style={styles.text}><Text style={styles.bold}>Seu Feedback:</Text> {item.feedback_sugestao || 'Não avaliado'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum histórico encontrado ainda.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#0047AB' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  date: { fontSize: 12, color: '#666', marginBottom: 5 },
  text: { fontSize: 14, color: '#333', marginBottom: 3 },
  bold: { fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#777', marginTop: 20 }
});