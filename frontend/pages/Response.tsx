import React, { useState } from 'react';
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
  const params = route.params as ResponseParams;
  const [isArchiving, setIsArchiving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const handleArchive = async () => {
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
          <Text style={styles.headerText}>Error</Text>
        </View>
        <Text style={styles.errorText}>No response data available</Text>
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
          <Text style={styles.text}>{params.response.verse}</Text>
          <Text style={styles.text}>{params.response.reference}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Relevance</Text>
          <Text style={styles.text}>{params.response.relevance}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Application</Text>
          <Text style={styles.text}>{params.response.explanation}</Text>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#FFD9D0',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  text: {
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
