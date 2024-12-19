import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { NavigationProps } from '../navigation.types';
import { BACKEND_URL } from '../config';

const exampleQuestions = [
  "I'm praying for healing for my mother who is battling cancer. Can you share a comforting verse and some guidance?",
  "I'm trying to decide whether to accept a new job offer or stay in my current position.",
  "I want to understand more about forgiveness and how to practice it",
  "I want to memorize Psalm 50:21-31. Can you help me with explanations and reflections on this verse?"
];

export default function Question() {
  const navigation = useNavigation<NavigationProps>();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExampleSelect = (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    handleSubmit(selectedQuestion);
  };

  const handleSubmit = async (questionText: string = question) => {
    if (!questionText.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      const apiUrl = `${BACKEND_URL}/generate`;
      console.log('Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ 
          prompt: questionText.trim(),
          userId: user.id 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(errorText || 'Failed to get response');
      }

      const responseData = await response.json();
      console.log('API Response:', responseData);

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          question: questionText.trim(),
          response: responseData,
          created_at: new Date().toISOString(),
          is_archived: false
        });

      if (saveError) {
        console.error('Error saving chat:', saveError);
      }

      navigation.navigate('Response', {
        question: questionText.trim(),
        response: responseData
      });
    } catch (err: any) {
      console.error('Error details:', err);
      setError(err.message || 'Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFD9D0"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Ask a Question</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.label}>Your Question</Text>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Type your question here..."
          multiline
          numberOfLines={4}
          style={styles.input}
          mode="outlined"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={() => handleSubmit()}
          style={styles.submitButton}
          loading={loading}
          disabled={loading || !question.trim()}
        >
          {loading ? 'Getting Response...' : 'Get Response'}
        </Button>

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Example Questions</Text>
          {exampleQuestions.map((q, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleItem}
              onPress={() => handleExampleSelect(q)}
            >
              <Text style={styles.exampleText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginBottom: 24,
    backgroundColor: '#FFD9D0',
  },
  examplesSection: {
    marginTop: 16,
  },
  examplesTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  exampleItem: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  exampleText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
