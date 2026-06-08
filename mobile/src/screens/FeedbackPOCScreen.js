import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';

export default function FeedbackPOCScreen({ navigation }) {
  const [rating, setRating] = useState(null);

  const handleSubmit = () => {
    if (!rating) {
      const msg = "Por favor, selecione uma nota.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Atenção", msg);
      return;
    }
    const successMsg = "Sua avaliação foi registrada. Obrigado por participar da validação da POC!";
    Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("Obrigado!", successMsg);
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validação da Solução</Text>
      <Text style={styles.subtitle}>Como você avalia a sua experiência de interação com o Mentor de Inteligência Artificial?</Text>
      <View style={styles.buttonRow}>
        {[1, 2, 3, 4, 5].map(num => (
          <View key={num} style={{ margin: 5 }}>
            <Button title={num.toString() + " Estrelas"} onPress={() => setRating(num)} color={rating === num ? "#28a745" : "#0047AB"} />
          </View>
        ))}
      </View>
      <View style={{ marginTop: 30 }}><Button title="Concluir e Enviar Avaliação" onPress={handleSubmit} color="#666" /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#0047AB' },
  subtitle: { fontSize: 16, marginBottom: 30, color: 'gray', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }
});