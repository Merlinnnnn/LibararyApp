import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

type FAQItem = {
  id: number;
  question: string;
  answer: string;
};

export default function HelpScreen() {
  const colorScheme = useColorScheme() || 'light';
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'Làm thế nào để mượn sách?',
      answer: 'Để mượn sách, bạn cần đăng nhập vào tài khoản, tìm kiếm sách mong muốn và nhấn nút "Mượn sách". Sau đó, bạn có thể đến thư viện để nhận sách trong thời gian quy định.',
    },
    {
      id: 2,
      question: 'Thời hạn mượn sách là bao lâu?',
      answer: 'Thời hạn mượn sách thông thường là 14 ngày. Bạn có thể gia hạn thêm 7 ngày nếu không có người khác đặt trước.',
    },
    {
      id: 3,
      question: 'Làm sao để gia hạn sách?',
      answer: 'Bạn có thể gia hạn sách bằng cách vào mục "Lịch sử mượn sách", chọn sách cần gia hạn và nhấn nút "Gia hạn". Lưu ý rằng bạn chỉ có thể gia hạn nếu sách chưa quá hạn.',
    },
    {
      id: 4,
      question: 'Phí phạt khi trả sách muộn là bao nhiêu?',
      answer: 'Phí phạt trả sách muộn là 5.000đ/ngày cho mỗi cuốn sách. Phí này sẽ được tính từ ngày hết hạn đến ngày trả sách.',
    },
    {
      id: 5,
      question: 'Làm thế nào để đặt trước sách?',
      answer: 'Khi sách đang được mượn, bạn có thể nhấn nút "Đặt trước" trên trang chi tiết sách. Khi sách được trả về, bạn sẽ nhận được thông báo và có 3 ngày để đến thư viện nhận sách.',
    },
    {
      id: 6,
      question: 'Có thể mượn tối đa bao nhiêu cuốn sách?',
      answer: 'Mỗi thẻ thư viện có thể mượn tối đa 5 cuốn sách cùng một lúc. Số lượng này có thể thay đổi tùy theo loại thẻ thành viên của bạn.',
    },
    {
      id: 7,
      question: 'Làm sao để đổi mật khẩu?',
      answer: 'Bạn có thể đổi mật khẩu bằng cách vào mục "Cài đặt" > "Thông tin cá nhân" > "Đổi mật khẩu". Bạn cần nhập mật khẩu cũ và mật khẩu mới để hoàn tất việc đổi mật khẩu.',
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>
            Câu hỏi thường gặp
          </Text>
        </View>

        <View style={styles.faqContainer}>
          {faqItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.faqItem, { backgroundColor: Colors[colorScheme].background }]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.questionContainer}>
                <Text style={[styles.question, { color: Colors[colorScheme].text }]}>
                  {item.question}
                </Text>
                <FontAwesome
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors[colorScheme].text}
                />
              </View>
              {expandedId === item.id && (
                <Text style={[styles.answer, { color: Colors[colorScheme].text }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  faqContainer: {
    padding: 16,
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  answer: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
    opacity: 0.8,
  },
}); 