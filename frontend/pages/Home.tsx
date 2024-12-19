import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { Text, Button, TextInput, Card, IconButton, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProps } from '../navigation.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, ChatItem } from '../lib/api';

// Import icons
const chatIcon = require('../assets/chat-icon.png');
const archiveIcon = require('../assets/archive-icon.png');

interface ChatItem {
  id: string;
  question: string;
  response: {
    verse: string;
    reference: string;
    relevance: string;
    explanation: string;
  };
  created_at: string;
  is_archived: boolean;
}

export default function Home() {
  const navigation = useNavigation<NavigationProps>();
  const [showHistory, setShowHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [archivedChats, setArchivedChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingChat, setDeletingChat] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const searchWidth = useRef(new Animated.Value(40)).current;
  const actionButtonsWidth = useRef(new Animated.Value(0)).current;

  const toggleSearch = () => {
    Animated.timing(searchWidth, {
      toValue: searchWidth._value === 40 ? 200 : 40,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleCardActions = (chatId: string | null) => {
    setActiveCard(chatId);
    Animated.timing(actionButtonsWidth, {
      toValue: chatId ? 96 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Load chats when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await api.signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const { chats: newChats, archivedChats: newArchivedChats } = await api.loadChats();
      setChats(newChats);
      setArchivedChats(newArchivedChats);
    } catch (error) {
      console.error('Error in loadChats:', error);
      if ((error as Error).message.includes('No user found')) {
        navigation.navigate('Login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async (chatId: string, currentlyArchived: boolean) => {
    try {
      await api.archiveChat(chatId, currentlyArchived);
      setSnackbarType('success');
      setSnackbarMessage(`Chat ${currentlyArchived ? 'unarchived' : 'archived'} successfully`);
      setSnackbarVisible(true);
      loadChats();
    } catch (error) {
      console.error('Error in handleArchiveToggle:', error);
      setSnackbarType('error');
      setSnackbarMessage((error as Error).message);
      setSnackbarVisible(true);
    }
  };

  const handleDelete = async (chatId: string) => {
    try {
      setDeletingChat(chatId);
      await api.deleteChat(chatId);
      setSnackbarType('success');
      setSnackbarMessage('Chat deleted successfully');
      setSnackbarVisible(true);
      loadChats();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setSnackbarType('error');
      setSnackbarMessage((error as Error).message);
      setSnackbarVisible(true);
    } finally {
      setDeletingChat(null);
    }
  };

  const filteredChats = (showHistory ? chats : archivedChats)
    .filter(chat => chat.question.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, showHistory ? 10 : 20);

  const renderEmptyState = () => {
    const totalCount = showHistory ? chats.length : archivedChats.length;
    const shownCount = filteredChats.length;
    const hasMore = totalCount > shownCount;
    
    if (loading) {
      return <Text style={styles.emptyText}>Loading your conversations...</Text>;
    }
    
    if (searchQuery && filteredChats.length === 0) {
      return <Text style={styles.emptyText}>No matches found for "{searchQuery}"</Text>;
    }
    
    if (filteredChats.length === 0) {
      return (
        <Text style={styles.emptyText}>
          {showHistory ? "No conversations yet" : "No archived conversations"}
        </Text>
      );
    }

    if (hasMore) {
      return (
        <Text style={styles.limitText}>
          Showing {shownCount} of {totalCount} {showHistory ? "conversations" : "archived items"}
        </Text>
      );
    }

    return null;
  };

  const renderChatItem = (chat: ChatItem) => {
    const isActive = activeCard === chat.id;
    
    return (
      <TouchableOpacity
        key={chat.id}
        style={styles.cardContainer}
        onPress={() => {
          if (isActive) {
            toggleCardActions(null);
          } else {
            navigation.navigate('Response', {
              question: chat.question,
              verse: chat.response.verse,
              reference: chat.response.reference,
              relevance: chat.response.relevance,
              explanation: chat.response.explanation
            });
          }
        }}
        onLongPress={() => toggleCardActions(chat.id)}
        delayLongPress={200}
      >
        <View style={styles.cardWrapper}>
          <Card style={[styles.historyCard, isActive && styles.activeCard]}>
            <View style={styles.historyCardHeader}>
              <View style={styles.questionContainer}>
                <Text style={styles.historyCardTitle} numberOfLines={2}>{chat.question}</Text>
                <Text style={styles.historyCardTime}>
                  {new Date(chat.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.verseContainer}>
              <Text style={styles.verseText} numberOfLines={2}>{chat.response.verse}</Text>
              <Text style={styles.referenceText}>{chat.response.reference}</Text>
            </View>
          </Card>
          <Animated.View style={[
            styles.actionButtons,
            { width: actionButtonsWidth }
          ]}>
            <IconButton
              icon={chat.is_archived ? 'archive-remove' : 'archive'}
              size={24}
              onPress={() => {
                handleArchiveToggle(chat.id, chat.is_archived);
                toggleCardActions(null);
              }}
              style={styles.actionButton}
            />
            <IconButton
              icon="delete"
              size={24}
              loading={deletingChat === chat.id}
              disabled={deletingChat === chat.id}
              onPress={() => {
                handleDelete(chat.id);
                toggleCardActions(null);
              }}
              iconColor="#FF6B6B"
              style={styles.actionButton}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Image 
            source={require('../assets/logo-full.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />

          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>
              Seek Your Verse, Find Your{' '}
              <Text style={[styles.mainTitle, styles.highlight]}>
                Path
              </Text>
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.newTopicButton} 
            onPress={() => navigation.navigate('Question')}
          >
            <Text style={styles.newTopicText}>+ New Topic</Text>
          </TouchableOpacity>

          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    showHistory && styles.activeToggle
                  ]}
                  onPress={() => setShowHistory(true)}
                >
                  <Text style={[
                    styles.toggleText,
                    showHistory && styles.activeToggleText
                  ]}>Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    !showHistory && styles.activeToggle
                  ]}
                  onPress={() => setShowHistory(false)}
                >
                  <Text style={[
                    styles.toggleText,
                    !showHistory && styles.activeToggleText
                  ]}>Archived</Text>
                </TouchableOpacity>
              </View>
              <Animated.View style={[styles.searchContainer, {
                width: searchWidth,
                flexDirection: 'row',
                alignItems: 'center',
              }]}>
                <TouchableOpacity onPress={toggleSearch}>
                  <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
                </TouchableOpacity>
                <Animated.View style={{ flex: 1, overflow: 'hidden', width: searchWidth }}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search history..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#666"
                  />
                </Animated.View>
              </Animated.View>
            </View>

            {loading ? (
              <Text style={styles.loadingText}>Loading your conversations...</Text>
            ) : filteredChats.length === 0 ? (
              <Text style={styles.emptyText}>
                {showHistory 
                  ? "No chat history yet. Start a new topic!" 
                  : "No archived chats yet."}
              </Text>
            ) : (
              <View style={styles.historyCards}>
                {filteredChats.map(renderChatItem)}
                {renderEmptyState()}
              </View>
            )}
          </View>

          <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton}>
            Logout
          </Button>
        </View>
      </ScrollView>
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
    flexGrow: 1,
  },
  logo: {
    width: '100%',
    height: 159,
    marginTop: 20,
    marginBottom: 30,
  },
  titleContainer: {
    marginBottom: 32,
  },
  mainTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '400',
  },
  highlight: {
    color: '#FFD9D0',
  },
  newTopicButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  newTopicText: {
    fontFamily: 'SF Pro Display',
    fontSize: 16,
    color: '#FFD9D0',
    fontWeight: '400',
  },
  historySection: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: '#333',
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#fff',
  },
  searchContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 8,
    overflow: 'hidden',
  },
  searchInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    color: '#fff',
    height: 40,
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    flex: 1,
  },
  activeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: '#FFD9D0',
    borderWidth: 1,
  },
  actionButtons: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  questionContainer: {
    flex: 1,
    marginRight: 8,
  },
  historyCardTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 22,
  },
  historyCardTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  verseContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  verseText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  referenceText: {
    fontSize: 12,
    color: '#FFD9D0',
    fontWeight: '500',
  },
  historyCards: {
    marginTop: 20,
  },
  loadingText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  limitText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: 20,
    borderColor: '#FFD9D0',
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
