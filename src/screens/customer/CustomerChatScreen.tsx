import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import useHideTabs from '../../navigation/useHideTabs';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import { useChatStore } from '../../stores/chatStore';
import { useToastStore } from '../../stores/toastStore';
import { useOrderStore } from '../../stores/orderStore';

const quickReplies = [
  "I'm here.",
  'Please call me.',
  'My address is correct.',
  'Gate is closed, message me.',
];

type CustomerChatRoute = RouteProp<AccountStackParamList, 'CustomerChat'>;

const CustomerChatScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<CustomerChatRoute>();
  const { orderId } = route.params;

  const ensureThread = useChatStore((state) => state.ensureThread);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const seedParticipantsFromOrder = useChatStore((state) => state.seedParticipantsFromOrder);
  const threads = useChatStore((state) => state.threads);
  const showToast = useToastStore((state) => state.showToast);
  const orders = useOrderStore((state) => state.orders);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<any>>(null);
  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const messages = useMemo(() => threads[orderId]?.messages ?? [], [threads, orderId]);
  const order = useMemo(() => orders.find((entry) => entry.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
        <View style={[layout.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 18, color: colors.dark }}>Chat not available</Text>
          <Text style={{ marginTop: 6, fontFamily: typography.fonts.regular, color: colors.gray600 }}>Order was not found.</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12, borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ fontFamily: typography.fonts.medium, color: colors.white }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    ensureThread(orderId);
  }, [ensureThread, orderId]);

  useEffect(() => {
    if (!order) return;
    seedParticipantsFromOrder(order);
  }, [order, seedParticipantsFromOrder]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 40);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = (rawText?: string) => {
    const payload = (rawText ?? text).trim();
    if (!payload) return;
    sendMessage(orderId, payload, 'customer');
    setText('');
    showToast({ type: 'success', title: 'Message sent', message: 'Message sent' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[layout.container, { flex: 1, paddingTop: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.white} />
            </TouchableOpacity>
            <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Chat</Text>
            <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>{orderId}</Text>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
            renderItem={({ item }) => {
              const isCustomer = item.sender === 'customer';
              return (
                <View style={{ alignItems: isCustomer ? 'flex-end' : 'flex-start' }}>
                  <View
                    style={{
                      maxWidth: '85%',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      backgroundColor: isCustomer ? colors.dark : colors.gray100,
                    }}
                  >
                    <Text style={{ fontFamily: typography.fonts.regular, color: isCustomer ? colors.white : colors.dark }}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={{ gap: 8, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {quickReplies.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  onPress={() => handleSend(reply)}
                  style={{ borderRadius: 999, backgroundColor: colors.gray100, paddingHorizontal: 12, paddingVertical: 7 }}
                >
                  <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.dark }}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type your message..."
                placeholderTextColor={colors.gray500}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderWidth: 1,
                  borderColor: colors.gray300,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  fontFamily: typography.fonts.regular,
                  color: colors.dark,
                }}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.dark,
                }}
              >
                <Ionicons name="send" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CustomerChatScreen;
