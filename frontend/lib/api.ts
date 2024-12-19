import { supabase } from './supabase';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user found');
    }

    const { data: allChats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading chats:', error);
      throw error;
    }

    const chats = allChats.filter(chat => !chat.is_archived);
    const archivedChats = allChats.filter(chat => chat.is_archived);

    return { chats, archivedChats };
  },

  async archiveChat(chatId: string, currentlyArchived: boolean): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .update({ is_archived: !currentlyArchived })
      .eq('id', chatId);

    if (error) {
      console.error('Error archiving chat:', error);
      throw error;
    }
  },

  async deleteChat(chatId: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },

  async createChat(question: string, response: ChatResponse): Promise<ChatItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No user found');
    }

    const { data, error } = await supabase
      .from('chats')
      .insert([
        {
          user_id: user.id,
          question,
          response,
          created_at: new Date().toISOString(),
          is_archived: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      throw error;
    }

    return data;
  },

  // Auth operations
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
};
