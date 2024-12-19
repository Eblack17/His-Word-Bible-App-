import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { Text, Button, TextInput, Card, IconButton, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProps } from '../navigation.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, ChatItem } from '../lib/api';
import { supabase } from '../lib/supabase';

// Import icons
const chatIcon = require('../assets/chat-icon.png');
const archiveIcon = require('../assets/archive-icon.png');

export default function Home() {
  const navigation = useNavigation<NavigationProps>();
  const [showHistory, setShowHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [archivedChats, setArchivedChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigation.navigate('Login');
          return;
        }
        loadChats();
      };

      checkAuth();
    }, [])
  );

  const loadChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const { chats: newChats, archivedChats: newArchivedChats } = await api.loadChats();
      setChats(newChats);
      setArchivedChats(newArchivedChats);
    } catch (err: any) {
      console.error('Error in loadChats:', err);
      if (err.message === 'No user found') {
        navigation.navigate('Login');
      } else {
        setError(err.message || 'Failed to load chats');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (chatId: string, currentlyArchived: boolean) => {
    try {
      setError(null);
      await api.archiveChat(chatId, currentlyArchived);
      await loadChats(); // Reload chats after archiving
    } catch (err: any) {
      console.error('Error archiving chat:', err);
      setError(err.message || 'Failed to archive chat');
    }
  };

  const handleDelete = async (chatId: string) => {
    try {
      setError(null);
      await api.deleteChat(chatId);
      await loadChats(); // Reload chats after deleting
    } catch (err: any) {
      console.error('Error deleting chat:', err);
      setError(err.message || 'Failed to delete chat');
    }
  };

  const handleSignOut = async () => {
    try {
      await api.signOut();
      navigation.navigate('Login');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const filteredChats = (showHistory ? chats : archivedChats).filter(chat =>
    chat.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>His Word</Text>
        <IconButton
          icon="logout"
          iconColor="#FFFFFF"
          size={24}
          onPress={handleSignOut}
        />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, showHistory && styles.activeTab]}
          onPress={() => setShowHistory(true)}
        >
          <Image source={chatIcon} style={styles.tabIcon} />
          <Text style={[styles.tabText, showHistory && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !showHistory && styles.activeTab]}
          onPress={() => setShowHistory(false)}
        >
          <Image source={archiveIcon} style={styles.tabIcon} />
          <Text style={[styles.tabText, !showHistory && styles.activeTabText]}>Archive</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatList}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : filteredChats.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No conversations found'
              : showHistory
              ? 'No conversations yet'
              : 'No archived conversations'}
          </Text>
        ) : (
          filteredChats.map((chat) => (
            <Card key={chat.id} style={styles.chatCard}>
              <Card.Content>
                <Text style={styles.questionText}>{chat.question}</Text>
                <Text style={styles.verseText}>
                  {chat.response.verse} - {chat.response.reference}
                </Text>
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <IconButton
                  icon={showHistory ? "archive" : "archive-off"}
                  iconColor="#666"
                  size={20}
                  onPress={() => handleArchive(chat.id, chat.is_archived)}
                />
                <IconButton
                  icon="delete"
                  iconColor="#666"
                  size={20}
                  onPress={() => handleDelete(chat.id)}
                />
                <IconButton
                  icon="chevron-right"
                  iconColor="#666"
                  size={20}
                  onPress={() => navigation.navigate('Response', {
                    question: chat.question,
                    response: chat.response
                  })}
                />
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Question')}
          style={styles.askButton}
          labelStyle={styles.askButtonText}
        >
          Ask a Question
        </Button>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Dismiss',
          onPress: () => setError(null),
        }}
      >
        {error}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#000000',
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#000000',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#1A1A1A',
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  tabText: {
    color: '#666666',
    fontSize: 16,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  chatList: {
    flex: 1,
    padding: 16,
  },
  chatCard: {
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
  },
  questionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 14,
    color: '#666666',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  footer: {
    padding: 16,
    backgroundColor: '#000000',
  },
  askButton: {
    backgroundColor: '#007AFF',
  },
  askButtonText: {
    fontSize: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
  },
});
