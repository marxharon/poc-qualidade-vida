import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function PersonaDashboardScreen({ route, navigation }) {
    const id_persona = route?.params?.id_persona || 1;
    const [latestSuggestion, setLatestSuggestion] = useState(null);
    const [loading, setLoading] = useState(true);

    // Resgata o histórico sempre que a tela focar, para pegar a sugestão mais recente gerada no chat
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            setLoading(true);
            api.get(`/personas/${id_persona}/history`)
                .then(res => {
                    if (!isActive) return;
                    const history = res.data.history;
                    if (history && history.length > 0) {
                        const last = history[0]; // Pega a última interação
                        setLatestSuggestion({
                            sugestao_acao: last.sugestao_ia,
                            eixo: last.nome_eixo || (last.id_eixo ? `Eixo Monitorado #${last.id_eixo}` : 'Acompanhamento Preditivo'),
                            percentual_adesao: last.percentual_adesao
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    if (isActive) setLoading(false);
                });
            return () => { isActive = false; };
        }, [id_persona])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 10, color: '#6b7280' }}>Carregando perfil do Gêmeo...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Menu da Persona</Text>
                <Text style={styles.subtitle}>Gerencie seu Gêmeo Digital e inicie suas interações de bem-estar diárias.</Text>
            </View>

            <TouchableOpacity style={styles.cardPrimary} onPress={() => navigation.navigate('DailyChat', { id_persona })}>
                <Text style={styles.cardIcon}>💬</Text>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardPrimaryTitle}>Bate-papo Diário</Text>
                    <Text style={styles.cardPrimaryDesc}>Relate seu dia e converse com seu mentor de IA.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cardSecondary} onPress={() => navigation.navigate('PersonaHistory', { id_persona })}>
                <Text style={styles.cardIcon}>📊</Text>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>Meu Gêmeo Digital</Text>
                    <Text style={styles.cardDesc}>Veja seu histórico e evolução nos eixos corporativos.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.cardSecondary, !latestSuggestion && styles.cardDisabled]} 
                onPress={() => latestSuggestion && navigation.navigate('SuggestionDetails', { suggestion: latestSuggestion, id_persona })}
                disabled={!latestSuggestion}
            >
                <Text style={styles.cardIcon}>🔍</Text>
                <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>Última Análise da IA</Text>
                    <Text style={styles.cardDesc}>
                        {latestSuggestion ? 'Entenda os vetores da última sugestão gerada.' : 'Nenhuma interação registrada ainda.'}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f9fafb' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30, marginTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
    subtitle: { fontSize: 14, color: '#6b7280', marginTop: 5, lineHeight: 20 },
    cardPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 3, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 5 },
    cardSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 3 },
    cardDisabled: { opacity: 0.5, backgroundColor: '#f3f4f6' },
    cardIcon: { fontSize: 32, marginRight: 15 },
    cardTextContainer: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
    cardDesc: { fontSize: 13, color: '#6b7280', flexShrink: 1 },
    cardPrimaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
    cardPrimaryDesc: { fontSize: 13, color: '#e0e7ff', flexShrink: 1 }
});