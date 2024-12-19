import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, IconButton, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProps } from '../navigation.types';
import { api } from '../lib/api';

type ResponseParams = {
  verse: string;
  reference: string;
  relevance: string;
  explanation: string;
  question: string;
};

export default function Response() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const params = route.params as ResponseParams;
  const [isArchiving, setIsArchiving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      
      await api.createChat(params.question, {
        verse: params.verse,
        reference: params.reference,
        relevance: params.relevance,
        explanation: params.explanation
      });

      setSnackbarType('success');
      setSnackbarMessage('Response archived successfully');
      setSnackbarVisible(true);

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error archiving response:', error);
      setSnackbarType('error');
      setSnackbarMessage((error as Error).message);
      setSnackbarVisible(true);
    } finally {
      setIsArchiving(false);
    }
  };

  if (!params) {
    console.error('No params provided to Response page');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor="#FFD9D0"
          />
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <Text style={styles.errorText}>No response data available</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Bible Verse Response</Text>
        </View>

        <ScrollView style={styles.scrollContent}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>Your Question</Text>
            <Text style={styles.questionText}>{params.question}</Text>
          </View>

          <View style={styles.verseContainer}>
            <Text style={styles.verseText}>{params.verse}</Text>
            <Text style={styles.referenceText}>{params.reference}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relevance</Text>
            <Text style={styles.sectionText}>{params.relevance}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application</Text>
            <Text style={styles.sectionText}>{params.explanation}</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Home')}
            style={styles.button}
            icon="home"
            textColor="#FFD9D0"
          >
            Home
          </Button>
          <Button
            mode="outlined"
            onPress={handleArchive}
            style={styles.button}
            icon="archive"
            loading={isArchiving}
            disabled={isArchiving}
            textColor="#FFD9D0"
          >
            Archive
          </Button>
        </View>
      </View>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={[
          styles.snackbar,
          snackbarType === 'success' ? styles.successSnackbar : styles.errorSnackbar
        ]}
      >
        {snackbarMessage}
      </Snackbar>
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
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 48, // To center the title accounting for the back button
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  questionLabel: {
    fontSize: 14,
    color: '#FFD9D0',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  verseContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  verseText: {
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 12,
  },
  referenceText: {
    fontSize: 16,
    color: '#FFD9D0',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFD9D0',
    marginBottom: 12,
    fontWeight: '500',
  },
  sectionText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    flex: 1,
    borderColor: '#FFD9D0',
    borderRadius: 25,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    margin: 16,
    borderRadius: 8,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  errorSnackbar: {
    backgroundColor: '#F44336',
  },
});
