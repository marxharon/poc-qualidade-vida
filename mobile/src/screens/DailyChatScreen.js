import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function DailyChatScreen({ route, navigation }) {
    const id_persona = route?.params?.id_persona || 1;
    
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]); // Histórico contínuo do chat
    const [inputText, setInputText] = useState('');
    const [feedbackGiven, setFeedbackGiven] = useState(false);
    const [latestSuggestion, setLatestSuggestion] = useState(null);
    const [showEndSession, setShowEndSession] = useState(false);
    const scrollViewRef = useRef();

    // useFocusEffect garante que a tela "zere" a sessão toda vez que for aberta, gerando uma nova pergunta!
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            
            const fetchDailyQuestion = async () => {
                setLoading(true);
                setMessages([]);
                setShowEndSession(false);
                setFeedbackGiven(false);
                setLatestSuggestion(null);
                setInputText('');
                
                try {
                    const response = await api.get(`/chat/daily-question?id_persona=${id_persona}`);
                    if (isActive) {
                        setMessages([{ id: Date.now().toString(), sender: 'ia', text: response.data.question, options: response.data.options }]);
                    }
                } catch (error) {
                    console.error("Erro ao buscar pergunta da IA:", error);
                } finally {
                    if (isActive) setLoading(false);
                }
            };

            fetchDailyQuestion();

            return () => { isActive = false; };
        }, [id_persona])
    );

    const handleSendResponse = async (text, msgIdToClearOptions = null) => {
        if (!text.trim()) return;
        
        // Limpa botões caso tenha clicado numa opção para a conversa ficar limpa
        if (msgIdToClearOptions) {
            setMessages(prev => prev.map(m => m.id === msgIdToClearOptions ? { ...m, options: [] } : m));
        }
        
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text }]);
        
        setInputText(''); // Limpa o campo
        Keyboard.dismiss();
        setLoading(true);
        
        try {
            const lastQuestion = messages.slice().reverse().find(m => m.sender === 'ia')?.text || "Pergunta do dia";

            const response = await api.post('/chat/respond', {
                relato: text,
                pergunta_ia: lastQuestion,
                id_persona
            });
            
            setLatestSuggestion(response.data);
            
            // O retorno da IA vira uma resposta orgânica no bate-papo sem forçar repetição!
            setMessages(prev => [
                ...prev,
                { id: (Date.now() + 1).toString(), sender: 'ia', text: response.data.resposta_chat || response.data.sugestao_acao }
            ]);
        } catch (error) {
            console.error("Erro ao enviar resposta:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (type) => {
        try {
            await api.post('/chat/feedback', { feedback: type, id_persona });
            setFeedbackGiven(true);
        } catch (error) {
            console.error("Erro ao enviar feedback:", error);
        }
    };

    const renderMessage = (msg) => {
        if (msg.sender === 'user') {
            return (
                <View key={msg.id} style={styles.bubbleUser}>
                    <Text style={styles.bubbleTextUser}>{msg.text}</Text>
                </View>
            );
        }

        return (
            <View key={msg.id} style={{ marginBottom: 16 }}>
                <View style={styles.bubbleIa}>
                    <Text style={styles.bubbleTextIa}>🤖 {msg.text}</Text>
                </View>

                {msg.options && msg.options.length > 0 && (
                    <View style={styles.interactionArea}>
                        <View style={styles.chipContainer}>
                            {msg.options.map((opt, idx) => {
                                return (
                                    <TouchableOpacity key={idx} style={styles.chip} onPress={() => handleSendResponse(opt, msg.id)}>
                                        <Text style={styles.chipText}>{opt}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    if (loading && messages.length === 0) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /><Text style={{marginTop: 10}}>Conectando ao Gêmeo Digital...</Text></View>;
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
            <ScrollView 
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                contentContainerStyle={styles.chatArea}
            >
                {messages.map(renderMessage)}
                
                {loading && messages.length > 0 && (
                    <View style={[styles.bubbleIa, { width: 60, alignItems: 'center' }]}>
                        <ActivityIndicator size="small" color="#3b82f6" />
                    </View>
                )}

                {/* Botão de Encerrar Sessão (Só aparece após você conversar ao menos 1 vez) */}
                {!showEndSession && messages.length > 1 && !loading && (
                    <TouchableOpacity style={styles.endSessionBtn} onPress={() => setShowEndSession(true)}>
                        <Text style={styles.endSessionBtnText}>🛑 Finalizar conversa por hoje</Text>
                    </TouchableOpacity>
                )}

                {showEndSession && latestSuggestion && (
                    <View style={styles.suggestionBox}>
                        <Text style={styles.suggestionTitle}>Sua Calibração Diária ({latestSuggestion.eixo})</Text>
                        <Text style={styles.suggestionText}>{latestSuggestion.sugestao_acao}</Text>
                        
                        {!feedbackGiven ? (
                            <View style={styles.feedbackContainer}>
                                <Text style={styles.feedbackPrompt}>Esta sugestão de fechamento fez sentido para você?</Text>
                                <View style={styles.feedbackButtons}>
                                    <TouchableOpacity style={[styles.fBtn, {backgroundColor: '#10b981'}]} onPress={() => handleFeedback('Boa')}><Text style={styles.fBtnTxt}>👍 Boa</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.fBtn, {backgroundColor: '#f59e0b'}]} onPress={() => handleFeedback('Indiferente')}><Text style={styles.fBtnTxt}>😐 Indiferente</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.fBtn, {backgroundColor: '#ef4444'}]} onPress={() => handleFeedback('Ruim')}><Text style={styles.fBtnTxt}>👎 Ruim</Text></TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.thankYouText}>Obrigado por ajudar a calibrar o seu Gêmeo Digital!</Text>
                        )}
                    </View>
                )}

                {showEndSession && (
                    <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('PersonaDashboard', { id_persona })}>
                        <Text style={styles.historyBtnText}>Voltar ao Menu da Persona</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Área de Input de Texto Livre */}
            {!showEndSession && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Escreva como você está se sentindo..."
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={() => handleSendResponse(inputText)}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={() => handleSendResponse(inputText)} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Enviar</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatArea: { padding: 20, paddingBottom: 40 },
    bubbleIa: { backgroundColor: '#e0e7ff', padding: 16, borderRadius: 16, borderBottomLeftRadius: 4, marginBottom: 8, alignSelf: 'flex-start', maxWidth: '85%' },
    bubbleTextIa: { fontSize: 16, color: '#1e40af', lineHeight: 22 },
    bubbleUser: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 16, borderBottomRightRadius: 4, marginBottom: 16, alignSelf: 'flex-end', maxWidth: '85%' },
    bubbleTextUser: { fontSize: 16, color: '#ffffff', lineHeight: 22 },
    interactionArea: { marginBottom: 16 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    chip: { backgroundColor: '#ffffff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', margin: 4 },
    chipText: { color: '#374151', fontSize: 14, fontWeight: '500' },
    inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e5e7eb' },
    textInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: '#1f2937', minHeight: 45 },
    sendButton: { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 20, marginLeft: 10 },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold' },
    suggestionBox: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
    suggestionTitle: { fontSize: 12, fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', marginBottom: 8 },
    suggestionText: { fontSize: 15, color: '#374151', lineHeight: 22, fontStyle: 'italic' },
    feedbackContainer: { marginTop: 20, borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 16 },
    feedbackPrompt: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
    feedbackButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    fBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
    fBtnTxt: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
    thankYouText: { marginTop: 20, fontSize: 14, color: '#10b981', textAlign: 'center', fontWeight: 'bold' },
    historyBtn: { marginTop: 30, backgroundColor: '#1f2937', padding: 14, borderRadius: 12, alignItems: 'center' },
            historyBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
            endSessionBtn: { marginTop: 16, backgroundColor: '#fee2e2', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f87171' },
            endSessionBtnText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 14 }
});