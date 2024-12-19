import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, IconButton, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationProps } from '../navigation.types';
import { api } from '../lib/api';

type ResponseParams = {
  question: string;
  response: {
    verse: string;
    reference: string;
    relevance: string;
    explanation: string;
  };
};

export default function Response() {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const [params, setParams] = useState<ResponseParams | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    console.log('Route params received:', route.params); // Debug log
    const routeParams = route.params as ResponseParams;
    
    if (!routeParams) {
      console.error('No route params received');
      return;
    }

    if (!routeParams.question) {
      console.error('No question in route params');
      return;
    }

    if (!routeParams.response) {
      console.error('No response in route params');
      return;
    }

    // Validate response fields
    const { verse, reference, relevance, explanation } = routeParams.response;
    if (!verse || !reference || !relevance || !explanation) {
      console.error('Missing required fields in response:', routeParams.response);
      return;
    }

    console.log('Setting params:', routeParams); // Debug log
    setParams(routeParams);
  }, [route.params]);

  // Debug log for params changes
  useEffect(() => {
    console.log('Current params:', params);
  }, [params]);

  const handleArchive = async () => {
    if (!params) return;

    try {
      setIsArchiving(true);
      
      await api.createChat(params.question, {
        verse: params.response.verse,
        reference: params.response.reference,
        relevance: params.response.relevance,
        explanation: params.response.explanation
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

  // Add immediate debug render
  console.log('Rendering Response component with params:', params);

  if (!params || !params.response) {
    console.error('No params or response provided to Response page');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor="#FFD9D0"
          />
          <Text style={styles.headerText}>Error</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>No response data available</Text>
          <Text style={styles.debugText}>Route params: {JSON.stringify(route.params, null, 2)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFD9D0"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerText}>Bible Verse Response</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.label}>Your Question</Text>
          <Text style={styles.text}>{params.question}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bible Verse</Text>
          <Text style={styles.verseText}>{params.response.verse}</Text>
          <Text style={styles.referenceText}>{params.response.reference}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Why This Verse?</Text>
          <Text style={styles.text}>{params.response.relevance}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Guidance & Application</Text>
          <Text style={styles.text}>{params.response.explanation}</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleArchive}
          loading={isArchiving}
          disabled={isArchiving}
          style={styles.archiveButton}
          textColor="#000000"
        >
          {isArchiving ? 'Saving...' : 'Save Response'}
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          styles.snackbar,
          { backgroundColor: snackbarType === 'success' ? '#4CAF50' : '#F44336' }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
  },
  headerText: {
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
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD9D0',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  verseText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: 8,
  },
  referenceText: {
    fontSize: 16,
    color: '#FFD9D0',
    fontWeight: 'bold',
  },
  archiveButton: {
    marginTop: 24,
    backgroundColor: '#FFD9D0',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 24,
  },
  debugText: {
    fontSize: 12,
    color: '#888888',
    padding: 16,
    fontFamily: 'monospace',
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
