import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Button } from 'react-native';
import api from '../services/api';

export default function DailyChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  // Fases: 'QUESTION', 'FEEDBACK', 'LOOP_ASK', 'END'
  const [flowStep, setFlowStep] = useState('QUESTION'); 
  const [options, setOptions] = useState([]);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);

  useEffect(() => {
    startDailyChat();
  }, []);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), text, sender }]);
  };

  const startDailyChat = async () => {
    try {
      const res = await api.get('/chat/daily');
      addMessage(res.data.question, 'bot');
      setOptions(res.data.options);
      setFlowStep('QUESTION');
    } catch (error) {
      addMessage("Olá! Como você está se sentindo hoje em relação ao trabalho?", 'bot');
      setOptions(["Ótimo", "Estressado", "Cansado", "Tudo tranquilo"]);
    }
  };

  const handleSendResponse = async (text) => {
    if (!text.trim()) return;
    addMessage(text, 'user');
    setInputText('');
    setOptions([]);

    if (flowStep === 'QUESTION') {
      // Envia resposta para análise da IA
      addMessage("Analisando seu relato...", 'bot');
      try {
        const res = await api.post('/chat/respond', { relato: text });
        const { sugestao_acao, eixo, percentual_adesao } = res.data;
        
        setCurrentSuggestion({ sugestao_acao, eixo, percentual_adesao });
        addMessage(`Sugestão: ${sugestao_acao}`, 'bot');
        
        // Pede Feedback (Item 8 do Framework)
        setTimeout(() => {
          addMessage("Como você avalia essa sugestão?", 'bot');
          setOptions(["Boa", "Ruim", "Indiferente"]);
          setFlowStep('FEEDBACK');
        }, 1000);
      } catch (e) {
        console.error(e);
      }
    } else if (flowStep === 'FEEDBACK') {
      // Computa Feedback
      await api.post('/chat/feedback', { feedback: text });
      addMessage("Obrigado pelo feedback!", 'bot');
      
      // Inicia Loop (Itens 10 e 11 do Framework)
      setTimeout(() => {
        addMessage("Deseja informar mais alguma coisa sobre seu bem-estar atual?", 'bot');
        setOptions(["Sim, quero falar mais", "Não, por hoje é só"]);
        setFlowStep('LOOP_ASK');
      }, 1000);
    } else if (flowStep === 'LOOP_ASK') {
      if (text.includes("Sim")) {
        addMessage("Pode me contar, estou ouvindo.", 'bot');
        setOptions([]);
        setFlowStep('QUESTION'); // Volta o fluxo
      } else {
        addMessage("Tenha um excelente dia! Nos falamos depois.", 'bot');
        setFlowStep('END');
      }
    }
  };

  const handleSkip = () => {
    addMessage("Prefiro não responder hoje.", 'user');
    setOptions([]);
    addMessage("Sem problemas! O importante é você se sentir confortável. Tenha um ótimo dia!", 'bot');
    setFlowStep('END');
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.botText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          <Button title="Ver Detalhes (IA)" onPress={() => navigation.navigate('SuggestionDetails', { suggestion: currentSuggestion })} disabled={!currentSuggestion} />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
          <Button title="Avaliar POC" onPress={() => navigation.navigate('FeedbackPOC')} color="#28a745" />
        </View>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 10 }}
      />

      {/* Chips de Resposta Rápida */}
      {options.length > 0 && (
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => (
            <TouchableOpacity key={idx} style={styles.chip} onPress={() => handleSendResponse(opt)}>
              <Text style={styles.chipText}>{opt}</Text>
            </TouchableOpacity>
          ))}
          {flowStep === 'QUESTION' && (
            <TouchableOpacity style={[styles.chip, { backgroundColor: '#f44336' }]} onPress={handleSkip}>
              <Text style={[styles.chipText, { color: '#fff' }]}>Pular (Não responder)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input de Texto Livre */}
      {flowStep !== 'END' && (
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.textInput} 
            placeholder="Digite como se sente..." 
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSendResponse(inputText)}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  messageBubble: { padding: 12, borderRadius: 10, marginVertical: 5, maxWidth: '80%' },
  botBubble: { backgroundColor: '#e0e0e0', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#0047AB', alignSelf: 'flex-end' },
  messageText: { fontSize: 16 },
  botText: { color: '#000' },
  userText: { color: '#fff' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, borderTopWidth: 1, borderColor: '#ccc' },
  chip: { backgroundColor: '#ddd', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, margin: 4 },
  chipText: { fontSize: 14, color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 20, paddingHorizontal: 15, height: 40, borderWidth: 1, borderColor: '#eee' },
  sendButton: { marginLeft: 10, backgroundColor: '#0047AB', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' }
});