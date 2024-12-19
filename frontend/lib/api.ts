import { auth, db } from './firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { signOut as firebaseSignOut } from 'firebase/auth';

export interface ChatResponse {
  verse: string;
  reference: string;
  relevance: string;
  explanation: string;
}

export interface ChatItem {
  id: string;
  question: string;
  response: ChatResponse;
  created_at: string;
  is_archived: boolean;
}

export const api = {
  // Chat operations
  async loadChats(): Promise<{ chats: ChatItem[], archivedChats: ChatItem[] }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user found');
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const processedChats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      response: typeof doc.data().response === 'string'
        ? JSON.parse(doc.data().response)
        : doc.data().response
    })) as ChatItem[];

    return {
      chats: processedChats.filter(chat => !chat.is_archived),
      archivedChats: processedChats.filter(chat => chat.is_archived),
    };
  },

  async archiveChat(chatId: string, currentlyArchived: boolean): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      is_archived: !currentlyArchived
    });
  },

  async deleteChat(chatId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await deleteDoc(chatRef);
  },

  async createChat(question: string, response: ChatResponse): Promise<ChatItem> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user found');
    }

    const chatsRef = collection(db, 'chats');
    const chatData = {
      user_id: user.uid,
      question,
      response: JSON.stringify(response),
      created_at: new Date().toISOString(),
      is_archived: false
    };

    const docRef = await addDoc(chatsRef, chatData);
    
    return {
      id: docRef.id,
      ...chatData,
      response
    };
  },

  // Auth operations
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }
};
