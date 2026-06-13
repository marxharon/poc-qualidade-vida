import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function OnboardingScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome_preferido: '',
        personalidade: '',
        gostos: '',
        desgostos: '',
        relacao_equipe: '',
        sentimento_trabalho: '',
        motivacoes: '',
        hardskills_softskills: ''
    });

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Envia para o Backend, que salva no PostgreSQL e aciona o IA-Service (ChromaDB)
            const response = await api.post('/personas', {
                ...formData,
                id_colaborador: 1, // Fixado para a POC
                aceite_lgpd_termos: true
            });
            
            Alert.alert("Sucesso!", "Seu Gêmeo Digital base foi gerado com sucesso na nossa base vetorial.");
            
            // Avança para a tela de Chat Diário passando o ID da Persona gerada
            if (navigation) {
                const generatedId = response.data?.persona?.id_persona || 1;
                navigation.navigate('PersonaDashboard', { id_persona: generatedId });
            }
        } catch (error) {
            console.error("Erro no Onboarding:", error);
            Alert.alert("Ops", "Falha ao gerar o Gêmeo Digital. Verifique sua conexão com o Backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Criação do Gêmeo Digital</Text>
            <Text style={styles.subtitle}>
                Responda com sinceridade. A Inteligência Artificial usará essas informações de forma anonimizada para moldar a consciência do seu Gêmeo Digital e gerar interações personalizadas.
            </Text>

            {Object.keys(formData).map((key, index) => (
                <View key={index} style={styles.inputGroup}>
                    <Text style={styles.label}>
                        {key.replace('_', ' ').toUpperCase()}
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder={`Descreva seu ${key.replace('_', ' ')}...`}
                        value={formData[key]}
                        onChangeText={(text) => handleChange(key, text)}
                        multiline={true}
                    />
                </View>
            ))}

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gerar Gêmeo Digital</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { padding: 24, paddingBottom: 60 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1f2937',
        minHeight: 60,
        textAlignVertical: 'top'
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});