import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { NavigationProps } from '../navigation.types';

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

      const response = await fetch('http://localhost:5000/api/get_verse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: questionText.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const result = await response.json();
      console.log('API Response:', result);

      const { error: saveError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          question: questionText.trim(),
          response: {
            verse: result.verse,
            reference: result.reference,
            relevance: result.relevance,
            explanation: result.explanation
          },
          created_at: new Date().toISOString(),
          is_archived: false
        });

      if (saveError) {
        console.error('Error saving chat:', saveError);
      }

      navigation.navigate('Response', {
        question: questionText.trim(),
        verse: result.verse,
        reference: result.reference,
        relevance: result.relevance,
        explanation: result.explanation
      });

    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor="#FFD9D0"
          />
        </View>

        <ScrollView style={styles.scrollContent}>
          <Text style={styles.mainTitle}>Where shall we begin as we tap into God's eternal wisdom?</Text>
          <View style={styles.examplesList}>
            {exampleQuestions.map((q, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.exampleButton,
                  loading && styles.disabledButton
                ]}
                onPress={() => handleExampleSelect(q)}
                disabled={loading}
              >
                <Text style={styles.exampleText}>{q}</Text>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor="rgba(255, 255, 255, 0.5)"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your question here..."
              value={question}
              onChangeText={setQuestion}
              multiline
              mode="outlined"
              disabled={loading}
              outlineColor="#FFD9D0"
              activeOutlineColor="#FFD9D0"
              textColor="#FFFFFF"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              theme={{
                colors: {
                  primary: '#FFD9D0',
                  text: '#FFFFFF',
                  placeholder: 'rgba(255, 255, 255, 0.5)',
                  background: 'transparent'
                }
              }}
            />
            <Button
              mode="outlined"
              onPress={() => handleSubmit()}
              style={styles.button}
              icon="send"
              loading={loading}
              disabled={loading || !question.trim()}
              textColor="#FFD9D0"
            >
              {loading ? 'Getting Answer...' : 'Get Answer'}
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  examplesList: {
    gap: 16,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  exampleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    paddingVertical: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exampleText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    flex: 1,
    paddingRight: 16,
  },
  chevronIcon: {
    margin: 0,
    padding: 0,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 20,
    marginTop: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    fontSize: 16,
    minHeight: 100,
    borderRadius: 25,
  },
  button: {
    borderColor: '#FFD9D0',
    borderRadius: 25,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 25,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
