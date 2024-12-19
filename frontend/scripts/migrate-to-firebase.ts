import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3K8B2keUu2sqpqb2Fp-NOw05vgC8aLRo",
  authDomain: "hisword-916b0.firebaseapp.com",
  projectId: "hisword-916b0",
  storageBucket: "hisword-916b0.firebasestorage.app",
  messagingSenderId: "698551280268",
  appId: "1:698551280268:web:a9cb26f7b1ecbe97cfd1a9",
  measurementId: "G-Z75XW2EXM9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test data
const testData = [
  {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    question: 'What does the Bible say about love?',
    response: {
      verse: '1 Corinthians 13:4-7',
      reference: '1 Corinthians 13:4-7',
      relevance: 'This passage directly addresses the nature of love',
      explanation: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.'
    },
    created_at: new Date().toISOString(),
    is_archived: false
  },
  {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    question: 'What does the Bible say about faith?',
    response: {
      verse: 'Hebrews 11:1',
      reference: 'Hebrews 11:1',
      relevance: 'This verse defines faith',
      explanation: 'Now faith is confidence in what we hope for and assurance about what we do not see.'
    },
    created_at: new Date().toISOString(),
    is_archived: false
  },
  {
    user_id: '987fcdeb-51a2-43d7-9012-345678901234',
    question: 'What does the Bible say about hope?',
    response: {
      verse: 'Romans 15:13',
      reference: 'Romans 15:13',
      relevance: 'This verse talks about hope',
      explanation: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.'
    },
    created_at: new Date().toISOString(),
    is_archived: true
  }
];

async function addTestDataToFirebase() {
  console.log('Adding test data directly to Firebase...');
  
  for (const item of testData) {
    try {
      const docRef = await addDoc(collection(db, 'chats'), item);
      console.log(`Successfully added test item to Firebase with ID: ${docRef.id}`);
    } catch (error) {
      console.error('Error adding test item:', error);
    }
  }
}

// Run the test data insertion
addTestDataToFirebase().then(() => {
  console.log('Test data insertion completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test data insertion failed:', error);
  process.exit(1);
});
