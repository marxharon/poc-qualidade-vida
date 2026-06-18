import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

export default function PersonaHistoryScreen({ route }) {
  const { id_persona } = route.params || {};
  const [history, setHistory] = useState([]);
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perception, setPerception] = useState(null);
  const [normalizedProfile, setNormalizedProfile] = useState(null);
  const [radarData, setRadarData] = useState([]);

  useEffect(() => {
    // Busca o histórico e os detalhes base da Persona simultaneamente
    Promise.all([
      api.get(`/personas/${id_persona || 1}/history`),
      api.get('/personas'),
      api.get(`/chat/perception?id_persona=${id_persona || 1}`).catch(() => ({ data: null })),
      api.get(`/personas/${id_persona || 1}/radar`).catch(() => ({ data: { radar: [] } }))
    ])
      .then(([historyRes, personasRes, perceptionRes, radarRes]) => {
        setHistory(historyRes.data.history);
        const currentPersona = personasRes.data?.personas?.find(p => p.id_persona === (id_persona || 1));
        setPersona(currentPersona || null);
        
        if (perceptionRes && perceptionRes.data) {
           setPerception(perceptionRes.data.percepcao);
           setNormalizedProfile(perceptionRes.data.perfil_normalizado);
        } else {
           setPerception("A IA não identificou deslocamentos críticos recentes no seu perfil.");
        }

        if (radarRes && radarRes.data && radarRes.data.radar) {
           // Filtra apenas os 3 eixos de maior alerta (menor score) para exibir no Status Preditivo
           const top3Radar = radarRes.data.radar.sort((a, b) => a.score - b.score).slice(0, 3);
           setRadarData(top3Radar.length > 0 ? top3Radar : []);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id_persona]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  // Filtra as interações para exibir na lista apenas as que ocorreram hoje
  const todaysHistory = history.filter(item => {
    if (!item.data_interacao) return false;
    const itemDate = new Date(item.data_interacao);
    const today = new Date();
    return itemDate.toDateString() === today.toDateString();
  });

  const renderHeader = () => (
      <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meu Gêmeo Digital</Text>
          <Text style={styles.headerSubtitle}>Acompanhe o reflexo do seu bem-estar ao longo do tempo.</Text>
          
          <View style={styles.radarBox}>
              <Text style={styles.radarTitle}>Status Preditivo (Últimos 7 dias)</Text>
              <Text style={styles.radarHint}>* A projeção do Status Preditivo indica o nível estimado de aderência da sua persona a cada eixo ESG. O escore percentual é calculado cruzando matematicamente o seu histórico recente de sentimentos (vetores da memória) com os Gêmeos Organizacionais saudáveis, apontando tendências de queda (risco) ou alta (saúde) no seu bem-estar.</Text>
              {radarData.map((item, index) => (
                  <View key={index} style={styles.barRow}>
                      <Text style={styles.barLabel}>{item.eixo}</Text>
                      <View style={styles.barBackground}>
                          <View style={[styles.barFill, { width: `${item.score}%`, backgroundColor: item.color }]} />
                      </View>
                      <Text style={styles.barScore}>{item.score}%</Text>
                  </View>
              ))}
              <Text style={styles.radarDisclaimer}>{perception || "A IA percebeu um deslocamento de risco na sua Carga de Trabalho recente."}</Text>
          </View>

          <View style={styles.profileBox}>
              <Text style={styles.profileTitle}>Perfil Atualizado do Gêmeo (Memória da IA)</Text>
              <Text style={styles.profileText}><Text style={styles.bold}>Identidade Base (Normalizada):</Text> {normalizedProfile || persona?.nome_preferido + ' - ' + persona?.personalidade}</Text>
              <Text style={styles.profileText}><Text style={styles.bold}>Última Atualização de Sentimento:</Text> {history.length > 0 ? history[0].resposta_colaborador : 'Nenhuma memória recente capturada.'}</Text>
          </View>

          <Text style={styles.listTitle}>Linha do Tempo de Interações (Hoje)</Text>
      </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => item?.id_interacao?.toString() || index.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.data_interacao).toLocaleDateString()}</Text>
                {item.feedback_sugestao && (
                    <Text style={styles.badge}>{item.feedback_sugestao}</Text>
                )}
            </View>
            {item.pergunta_ia && (
                <Text style={styles.textQuestion}><Text style={styles.bold}>Pergunta da IA:</Text> {item.pergunta_ia}</Text>
            )}
            <Text style={styles.text}><Text style={styles.bold}>Meu relato:</Text> {item.resposta_colaborador}</Text>
            <Text style={styles.textIa}><Text style={styles.bold}>Acolhimento da IA:</Text> {item.sugestao_ia}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma interação registrada hoje.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  radarBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
  radarTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  radarHint: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginBottom: 16, lineHeight: 18 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 110, fontSize: 12, color: '#4b5563', fontWeight: '500' },
  barBackground: { flex: 1, height: 10, backgroundColor: '#f3f4f6', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barScore: { width: 40, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
  radarDisclaimer: { marginTop: 10, fontSize: 11, color: '#ef4444', fontStyle: 'italic' },
  profileBox: { backgroundColor: '#e0e7ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#c7d2fe', marginBottom: 24 },
  profileTitle: { fontSize: 15, fontWeight: 'bold', color: '#3730a3', marginBottom: 10 },
  profileText: { fontSize: 13, color: '#4338ca', marginBottom: 6, lineHeight: 18 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  badge: { fontSize: 10, backgroundColor: '#e0e7ff', color: '#4f46e5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontWeight: 'bold', overflow: 'hidden' },
  text: { fontSize: 14, color: '#4b5563', marginBottom: 6, lineHeight: 20 },
  textIa: { fontSize: 14, color: '#3b82f6', marginBottom: 3, lineHeight: 20 },
  textQuestion: { fontSize: 14, color: '#6b7280', marginBottom: 6, fontStyle: 'italic', lineHeight: 20 },
  bold: { fontWeight: 'bold', color: '#1f2937' },
  empty: { textAlign: 'center', color: '#777', marginTop: 20 }
});