import { StyleSheet, View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useState, useEffect } from 'react';
import { documentService } from '../services/book/document.service';
import { Document } from '../services/types/book.types';

export default function DigitalViewerScreen() {
  const { id, fileName, filePath } = useLocalSearchParams();
  const colorScheme = useColorScheme() || 'light';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Here you would implement the logic to fetch and display the digital document
    // This could involve using a PDF viewer component or other document viewer
    setIsLoading(false);
  }, [id, fileName, filePath]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <Text style={[styles.errorText, { color: Colors[colorScheme].text }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <Stack.Screen 
        options={{
          title: fileName as string,
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
        }} 
      />
      <View style={styles.content}>
        <Text style={[styles.message, { color: Colors[colorScheme].text }]}>
          Đang xem tài liệu: {fileName}
        </Text>
        {/* Here you would implement the actual document viewer component */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
}); 