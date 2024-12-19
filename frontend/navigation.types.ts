import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  SignUp: undefined;
  Home: undefined;
  Question: { chatId?: string } | undefined;
  Response: {
    question: string;
    response: {
      verse: string;
      reference: string;
      relevance: string;
      explanation: string;
    };
  };
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
