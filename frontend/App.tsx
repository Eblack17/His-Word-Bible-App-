import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Question from './pages/Question';
import Response from './pages/Response';
import { Platform } from 'react-native';

const Stack = createNativeStackNavigator();

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFD9D0',
    background: '#000000',
    text: '#FFFFFF',
    placeholder: '#666666',
    accent: '#FFD9D0',
  },
};

if (Platform.OS === 'web') {
  // @ts-ignore
  window._frameTimestamp = null;
}

export default function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <NavigationContainer>
        <PaperProvider theme={theme}>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              contentStyle: { backgroundColor: '#000000' }
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPassword} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUp} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={Home} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Question" 
              component={Question} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Response" 
              component={Response} 
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </PaperProvider>
      </NavigationContainer>
    </SessionContextProvider>
  );
}