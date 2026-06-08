import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import api from '../services/api';

export default function OnboardingScreen({ navigation }) {
  const [form, setForm] = useState({
    nome_preferido: '',
    personalidade: '',
    gostos: '',
    desgostos: '',
    relacao_equipe: '',
    sentimento_trabalho: '',
    motivacoes: '',
    hardskills_softskills: '',
    aceite_lgpd_termos: false,
  });

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: \n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    console.log('Botão Salvar clicado! Dados atuais do formulário:', form);
    if (!form.aceite_lgpd_termos) {
      showAlert('Atenção Ética', 'O projeto requer o aceite dos termos de LGPD e consentimento para anonimização dos dados.');
      return;
    }

    try {
      console.log('Enviando requisição para o backend...');
      const response = await api.post('/personas', form);
      console.log('Resposta do backend:', response.data);
      if (response.data.success) {
        showAlert('Sucesso!', 'Sua Persona foi inicializada! Vamos ao chat diário.');
        navigation.replace('DailyChat'); // Muda de tela e impede voltar ao onboarding
      }
    } catch (error) {
      showAlert('Erro', 'Ocorreu um erro na comunicação com o servidor. Verifique se o backend está rodando.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Para personalizar seu mentor de IA, conte-nos um pouco sobre você:</Text>

      <Text style={styles.label}>1. Como prefere ser chamado?</Text>
      <TextInput style={styles.input} value={form.nome_preferido} onChangeText={(text) => handleChange('nome_preferido', text)} />
      <Text style={styles.label}>2. Como você descreve sua personalidade?</Text>
      <TextInput style={styles.input} value={form.personalidade} onChangeText={(text) => handleChange('personalidade', text)} />
      <Text style={styles.label}>3. O que você mais gosta de fazer no trabalho?</Text>
      <TextInput style={styles.input} value={form.gostos} onChangeText={(text) => handleChange('gostos', text)} />
      <Text style={styles.label}>4. O que você menos gosta de fazer?</Text>
      <TextInput style={styles.input} value={form.desgostos} onChangeText={(text) => handleChange('desgostos', text)} />
      <Text style={styles.label}>5. Como é sua relação com a equipe?</Text>
      <TextInput style={styles.input} value={form.relacao_equipe} onChangeText={(text) => handleChange('relacao_equipe', text)} />
      <Text style={styles.label}>6. Como você se sente realizando seu trabalho atualmente?</Text>
      <TextInput style={styles.input} value={form.sentimento_trabalho} onChangeText={(text) => handleChange('sentimento_trabalho', text)} />
      <Text style={styles.label}>7. Quais são suas maiores motivações profissionais?</Text>
      <TextInput style={styles.input} value={form.motivacoes} onChangeText={(text) => handleChange('motivacoes', text)} />
      <Text style={styles.label}>8. Quais são suas principais expertises (Hard/Soft skills)?</Text>
      <TextInput style={styles.input} value={form.hardskills_softskills} onChangeText={(text) => handleChange('hardskills_softskills', text)} />

      <View style={styles.switchContainer}>
        <Switch value={form.aceite_lgpd_termos} onValueChange={(value) => handleChange('aceite_lgpd_termos', value)} />
        <Text style={styles.switchText}>Aceito os termos da LGPD e concordo que os dados serão utilizados de forma anonimizada e agregada para uso da IA.</Text>
      </View>
      <Button title="Salvar e Criar Persona" onPress={handleSubmit} color="#0047AB" />
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 16, marginBottom: 20, fontWeight: 'bold' },
  label: { marginTop: 10, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginTop: 5, backgroundColor: '#f9f9f9' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20, paddingRight: 40 },
  switchText: { marginLeft: 10, fontSize: 12, color: '#555', flexShrink: 1 },
});