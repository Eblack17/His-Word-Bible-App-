import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  SignUp: undefined;
  Home: undefined;
  Question: { chatId?: string } | undefined;
  Response: {
    verse: string;
    reference: string;
    relevance: string;
    explanation: string;
    question: string;
  };
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
