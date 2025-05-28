import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { chatAPI, Message, QuickReply, BookDetails } from '../../services/chat/chatService';

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

interface RequestPayload {
  eventName: string;
  parameters: any;
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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session-${Math.random().toString(36).substr(2, 9)}`);
  const scrollViewRef = useRef<ScrollView>(null);
  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [bookDetailsOpen, setBookDetailsOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      scrollToBottom();
    }
  }, [visible, messages]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async (text: string, payload?: string | RequestPayload) => {
    if (!text.trim() && !payload) return;

    // Add user message to UI immediately
    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Format request data with correct structure
      const requestData: {
        message: string;
        sessionId: string;
        eventName?: string;
        parameters?: any;
      } = {
        message: text.trim(),
        sessionId: sessionId,
        ...(typeof payload === 'object' && payload !== null ? {
          eventName: payload.eventName,
          parameters: payload.parameters
        } : {})
      };

      // Send message to API with correct structure
      const response = await chatAPI.sendMessage(
        requestData.message,
        requestData.sessionId,
        {
          message: requestData.message,
          sessionId: requestData.sessionId,
          eventName: requestData.eventName,
          parameters: requestData.parameters
        }
      );

      if (response.success) {
        // Add bot response to UI
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.reply,
          isUser: false,
          timestamp: new Date(),
          quickReplies: response.data.quickReplies || undefined,
          cards: response.data.cards || undefined,
          options: response.data.suggestions || undefined,
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Handle API error
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: response.message || 'Xin lỗi, đã có lỗi xảy ra.',
          isUser: false,
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      console.error('Network error:', err);
      // Handle network error
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Lỗi mạng, vui lòng thử lại sau.',
        isUser: false,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (qr: QuickReply) => {
    try {
      // Parse the payload string to JSON
      const parsedPayload = JSON.parse(qr.payload);
      
      // Format the payload to match required structure
      const formattedPayload = {
        eventName: parsedPayload.eventName,
        parameters: parsedPayload.parameters
      };

      // Log the formatted payload for debugging
      console.log('Quick Reply Payload:', formattedPayload);

      // Send message with formatted payload
      handleSend(qr.text, formattedPayload);
    } catch (err) {
      console.error('Invalid payload:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.',
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  };

  const handleGetBtn = async (url: string) => {
    const match = url.match(/\/api\/v1\/documents\/(\d+)/);
    if (match) {
      try {
        const data = await chatAPI.getBookDetails(match[1]);
        setBookDetails(data.data);
        setBookDetailsOpen(true);
      } catch (err) {
        console.error('Error fetching book details:', err);
      }
    }
  };

  const handleCardButton = (btn: { type: string; text: string; payload?: string; url?: string }) => {
    try {
      if (btn.type === 'POST' && btn.payload) {
        // Parse and format payload for POST request
        const parsedPayload = JSON.parse(btn.payload);
        const formattedPayload = {
          eventName: parsedPayload.eventName,
          parameters: parsedPayload.parameters
        };
        
        // Send message with formatted payload
        handleSend(btn.text, formattedPayload);
      } else if (btn.type === 'GET' && btn.url) {
        handleGetBtn(btn.url);
      }
    } catch (err) {
      console.error('Invalid button payload:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.',
        isUser: false,
        timestamp: new Date(),
      }]);
    }
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

                {message.quickReplies && message.quickReplies.length > 0 && (
                  <View style={styles.quickRepliesContainer}>
                    {message.quickReplies.map((qr, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.quickReplyButton, { backgroundColor: Colors[colorScheme].tint }]}
                        onPress={() => handleQuickReply(qr)}
                      >
                        <Text style={styles.quickReplyText}>{qr.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {message.cards && message.cards.length > 0 && (
                  <View style={styles.cardsContainer}>
                    {message.cards.map((card, index) => (
                      <View key={index} style={styles.card}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                        {card.imageUrl && (
                          <Image
                            source={{ uri: card.imageUrl }}
                            style={styles.cardImage}
                          />
                        )}
                        <View style={styles.cardButtons}>
                          {card.buttons.map((btn, btnIndex) => (
                            <TouchableOpacity
                              key={btnIndex}
                              style={[styles.cardButton, { backgroundColor: Colors[colorScheme].tint }]}
                              onPress={() => handleCardButton(btn)}
                            >
                              <Text style={styles.cardButtonText}>{btn.text}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {message.options && message.options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {message.options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.optionButton}
                        disabled
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors[colorScheme].tint} />
                <Text style={[styles.loadingText, { color: Colors[colorScheme].text }]}>
                  Đang xử lý...
                </Text>
              </View>
            )}
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
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: Colors[colorScheme].tint,
                  opacity: isLoading ? 0.5 : 1
                }
              ]}
              onPress={() => handleSend(inputText)}
              disabled={isLoading}
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
  quickRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickReplyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickReplyText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  cardsContainer: {
    marginTop: 8,
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardButtons: {
    gap: 8,
  },
  cardButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  optionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 14,
  },
}); 