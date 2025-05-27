import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
  const colorScheme = useColorScheme() || 'light';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý thư viện. Tôi có thể giúp gì cho bạn?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      scrollToBottom();
    }
  }, [visible, messages]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // TODO: Implement actual chatbot response logic here
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Tôi đang xử lý yêu cầu của bạn...',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: Colors[colorScheme].background }
        ]}>
          <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
              Trợ lý thư viện
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <FontAwesome name="times" size={20} color={Colors[colorScheme].text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.botMessage,
                  { backgroundColor: message.isUser ? Colors[colorScheme].tint : Colors[colorScheme].background }
                ]}
              >
                <Text style={[
                  styles.messageText,
                  { color: message.isUser ? '#FFFFFF' : Colors[colorScheme].text }
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  { color: message.isUser ? '#FFFFFF80' : Colors[colorScheme].text + '80' }
                ]}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme].background }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: Colors[colorScheme].background,
                color: Colors[colorScheme].text,
                borderColor: Colors[colorScheme].text + '20'
              }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={Colors[colorScheme].text + '80'}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={handleSend}
            >
              <FontAwesome name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: Dimensions.get('window').height * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 