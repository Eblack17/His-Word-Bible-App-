import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button, TextInput, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { NavigationProps } from '../navigation.types';
import { BACKEND_URL } from '../config';
import { ChatResponse } from '../lib/api';

const exampleQuestions = [
  "I'm praying for healing for my mother who is battling cancer. Can you share a comforting verse and some guidance?",
  "I'm trying to decide whether to accept a new job offer or stay in my current position.",
  "I want to understand more about forgiveness and how to practice it",
  "I want to memorize Psalm 50:21-31. Can you help me with explanations and reflections on this verse?"
];

const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000; // 30 seconds

export default function Question() {
  const navigation = useNavigation<NavigationProps>();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExampleSelect = (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    handleSubmit(selectedQuestion);
  };

  const makeRequest = async (questionText: string, retryCount = 0): Promise<{ response: ChatResponse }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Get user ID if logged in, but don't require it
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      const apiUrl = `${BACKEND_URL}/generate`;
      console.log('Making request to:', apiUrl); // Debug log

      const requestBody = { 
        question: questionText.trim(),
        userId: userId
      };
      console.log('Request body:', requestBody); // Debug log

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        credentials: 'omit'  // Changed from 'include' to 'omit'
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Error response:', errorData); // Debug log
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', JSON.stringify(data, null, 2)); // Pretty print the response
      
      if (!data || !data.response) {
        throw new Error('Invalid response format from server');
      }

      // Extract and validate each field
      const { verse, reference, relevance, explanation } = data.response;
      if (!verse || !reference || !relevance || !explanation) {
        console.error('Missing required fields in response:', data.response);
        throw new Error('Invalid response format from server');
      }

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Request error:', err); // Debug log

      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }

      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying request (attempt ${retryCount + 1})`); // Debug log
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return makeRequest(questionText, retryCount + 1);
      }

      throw err;
    }
  };

  const handleSubmit = async (questionText: string = question) => {
    if (!questionText.trim()) {
      setError('Please enter a question');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await makeRequest(questionText);
      console.log('API Response:', JSON.stringify(data, null, 2)); // Pretty print the response
      
      if (!data || !data.response) {
        throw new Error('Invalid response format from server');
      }

      // Extract and validate each field
      const { verse, reference, relevance, explanation } = data.response;
      if (!verse || !reference || !relevance || !explanation) {
        console.error('Missing required fields in response:', data.response);
        throw new Error('Invalid response format from server');
      }

      const navigationData = {
        question: questionText.trim(),
        response: {
          verse,
          reference,
          relevance,
          explanation
        }
      };
      console.log('About to navigate with:', JSON.stringify(navigationData, null, 2));

      // Force navigation to reset and go to Response
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Question' },
          { name: 'Response', params: navigationData }
        ],
      });

      console.log('Navigation completed');
    } catch (err: any) {
      console.error('Error submitting question:', err);
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
        <Text style={styles.title}>Ask a Question</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>
          Ask any question about life, faith, or specific Bible verses. I'll provide relevant verses and guidance.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Type your question here..."
          value={question}
          onChangeText={(text) => {
            setQuestion(text);
            setError(null);
          }}
          multiline
          numberOfLines={4}
          mode="outlined"
          error={!!error}
          disabled={loading}
        />
        
        {error && (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={() => handleSubmit()}
          style={styles.submitButton}
          loading={loading}
          disabled={loading || !question.trim()}
        >
          {loading ? 'Submitting...' : 'Submit Question'}
        </Button>

        <Text style={styles.exampleTitle}>Example Questions:</Text>
        {exampleQuestions.map((q, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleItem}
            onPress={() => handleExampleSelect(q)}
            disabled={loading}
          >
            <Text style={styles.exampleText}>{q}</Text>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#1A1A1A',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD9D0',
    textAlign: 'center',
    marginRight: 48,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    padding: 16,
    lineHeight: 24,
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
  },
  submitButton: {
    margin: 16,
    backgroundColor: '#FFD9D0',
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD9D0',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  exampleItem: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  exampleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
});
