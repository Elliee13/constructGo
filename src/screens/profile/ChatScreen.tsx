import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/AccountStack';
import { layout } from '../../theme/layout';
import { colors, typography } from '../../theme/theme';
import useHideTabs from '../../navigation/useHideTabs';

const ChatScreen = () => {
  useHideTabs();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId as string;
  const [tab, setTab] = useState<'Current' | 'History'>('Current');
  const [message, setMessage] = useState('');
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white, paddingTop: topInset }}>
      <View style={[layout.container, { paddingTop: 12, paddingBottom: 12 }]}> 
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 42, height: 34, borderRadius: 8, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.white} />
        </TouchableOpacity>
        <Text style={{ fontFamily: typography.fonts.semibold, fontSize: 20, color: colors.dark }}>Chat</Text>

        <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
          {['Current', 'History'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setTab(item as 'Current' | 'History')}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: tab === item ? colors.dark : colors.gray100,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: tab === item ? colors.white : colors.dark }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}>
        <View style={{ marginTop: 10, gap: 12 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.gray100, padding: 10, borderRadius: 12, maxWidth: '80%' }}>
            <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>Hi! I’m on the way.</Text>
          </View>
          <View style={{ alignSelf: 'flex-end', backgroundColor: colors.dark, padding: 10, borderRadius: 12, maxWidth: '80%' }}>
            <Text style={{ fontFamily: typography.fonts.regular, color: colors.white }}>Okay, thanks!</Text>
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.gray100, padding: 10, borderRadius: 12, maxWidth: '80%' }}>
            <Text style={{ fontFamily: typography.fonts.regular, color: colors.dark }}>I’ll arrive in 10 minutes.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white }}>
        <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 10), paddingTop: 6, borderTopWidth: 1, borderColor: colors.gray200 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message"
              placeholderTextColor={colors.gray500}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.gray200,
                paddingHorizontal: 12,
                fontFamily: typography.fonts.regular,
                color: colors.dark,
              }}
            />
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="send" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.gray100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: typography.fonts.medium, color: colors.dark }}>Driver John</Text>
              <Text style={{ fontFamily: typography.fonts.regular, fontSize: 12, color: colors.gray600 }}>Toyota Vios • ABC-123</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.dark }}>
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.white }}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Track', { orderId })}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.dark }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.white }}>Track</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('DriverProfile', { orderId })}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.dark }}
              >
                <Text style={{ fontFamily: typography.fonts.medium, fontSize: 12, color: colors.white }}>See More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
