import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function SelectPersonaScreen({ navigation }) {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/personas')
      .then(res => { setPersonas(res.data.personas); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0047AB" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecione sua Persona</Text>
      <FlatList
        data={personas}
        keyExtractor={(item) => item.id_persona.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('DailyChat', { id_persona: item.id_persona })}
          >
            <Text style={styles.name}>{item.nome_preferido || `Persona #${item.id_persona}`}</Text>
            <Text style={styles.desc}>{item.personalidade || 'Sem descrição definida.'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma persona cadastrada na POC.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#0047AB' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 14, color: '#666', marginTop: 5 },
  empty: { textAlign: 'center', color: '#777', marginTop: 20 }
});