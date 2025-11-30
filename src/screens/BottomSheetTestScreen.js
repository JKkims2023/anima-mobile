/**
 * 🧪 BottomSheet Test Screen
 * 
 * Test screen for CustomBottomSheet component
 * 
 * Tests:
 * 1. Basic bottom sheet with title
 * 2. Bottom sheet with subtitle
 * 3. Bottom sheet with 1 button
 * 4. Bottom sheet with 2 buttons
 * 5. Bottom sheet with dynamic content
 * 6. Bottom sheet with form inputs
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomBottomSheet from '../components/CustomBottomSheet';
import CustomButton from '../components/CustomButton';
import CustomText from '../components/CustomText';
import NeonInputBottomSheet from '../components/auth/NeonInputBottomSheet'; // ✅ BottomSheet용
import ForgotPasswordSheet from '../components/auth/ForgotPasswordSheet'; // ✅ ForgotPasswordSheet
import { scale, moderateScale, platformPadding } from '../utils/responsive-utils';
const commonstyles = require('../styles/commonstyles');

const BottomSheetTestScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = commonstyles.whiteTheme;

  // Refs for each bottom sheet
  const basicSheetRef = useRef(null);
  const subtitleSheetRef = useRef(null);
  const oneButtonSheetRef = useRef(null);
  const twoButtonsSheetRef = useRef(null);
  const dynamicSheetRef = useRef(null);
  const formSheetRef = useRef(null);

  // State for form sheet
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ Forgot password sheet state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // ==================== Handlers ====================

  const handleBasicOpen = () => {
    basicSheetRef.current?.present();
  };

  const handleSubtitleOpen = () => {
    subtitleSheetRef.current?.present();
  };

  const handleOneButtonOpen = () => {
    oneButtonSheetRef.current?.present();
  };

  const handleTwoButtonsOpen = () => {
    twoButtonsSheetRef.current?.present();
  };

  const handleDynamicOpen = () => {
    dynamicSheetRef.current?.present();
  };

  const handleFormOpen = () => {
    formSheetRef.current?.present();
  };

  const handleConfirm = () => {
    Alert.alert('확인', '확인 버튼을 눌렀습니다!');
    oneButtonSheetRef.current?.dismiss();
  };

  const handleSave = () => {
    Alert.alert('저장', '저장 버튼을 눌렀습니다!');
    twoButtonsSheetRef.current?.dismiss();
  };

  const handleCancel = () => {
    twoButtonsSheetRef.current?.dismiss();
  };

  const handleFormSubmit = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('성공', `이메일: ${formData.email}\n비밀번호: ${formData.password}`);
      formSheetRef.current?.dismiss();
    }, 2000);
  };

  const handleFormClose = () => {
    setFormData({ email: '', password: '' });
    formSheetRef.current?.dismiss();
  };

  // ==================== Render ====================

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + platformPadding(20) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <CustomText type="big" bold style={{ color: theme.textPrimary }}>
            🧪 BottomSheet Test
          </CustomText>
          <CustomText type="normal" style={{ color: theme.textSecondary, marginTop: scale(8) }}>
            CustomBottomSheet 컴포넌트 테스트
          </CustomText>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <CustomText type="title" bold style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            기본 테스트
          </CustomText>

          <CustomButton
            title="1️⃣ Basic Bottom Sheet"
            type="primary"
            onPress={handleBasicOpen}
            style={styles.testButton}
          />

          <CustomButton
            title="2️⃣ With Subtitle"
            type="primary"
            onPress={handleSubtitleOpen}
            style={styles.testButton}
          />
        </View>

        <View style={styles.section}>
          <CustomText type="title" bold style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            버튼 테스트
          </CustomText>

          <CustomButton
            title="3️⃣ One Button"
            type="primary"
            onPress={handleOneButtonOpen}
            style={styles.testButton}
          />

          <CustomButton
            title="4️⃣ Two Buttons"
            type="primary"
            onPress={handleTwoButtonsOpen}
            style={styles.testButton}
          />
        </View>

        <View style={styles.section}>
          <CustomText type="title" bold style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            콘텐츠 테스트
          </CustomText>

          <CustomButton
            title="5️⃣ Dynamic Content"
            type="primary"
            onPress={handleDynamicOpen}
            style={styles.testButton}
          />

          <CustomButton
            title="6️⃣ Form with Inputs"
            type="primary"
            onPress={handleFormOpen}
            style={styles.testButton}
          />

          <CustomButton
            title="🔐 Forgot Password"
            type="primary"
            onPress={() => setIsForgotPasswordOpen(true)}
            style={styles.testButton}
          />
        </View>
      </ScrollView>

      {/* ==================== Bottom Sheets ==================== */}

      {/* 1. Basic Bottom Sheet */}
      <CustomBottomSheet
        ref={basicSheetRef}
        title="기본 바텀시트"
        onClose={() => basicSheetRef.current?.dismiss()}
      >
        <CustomText type="normal" style={{ color: theme.textPrimary }}>
          이것은 기본 바텀시트입니다.{'\n'}
          타이틀과 닫기 버튼만 있습니다.{'\n\n'}
          아래로 드래그하거나 배경을 터치하면 닫힙니다.
        </CustomText>
      </CustomBottomSheet>

      {/* 2. With Subtitle */}
      <CustomBottomSheet
        ref={subtitleSheetRef}
        title="서브타이틀 포함"
        subtitle="이것은 서브타이틀입니다"
        onClose={() => subtitleSheetRef.current?.dismiss()}
      >
        <CustomText type="normal" style={{ color: theme.textPrimary }}>
          타이틀과 서브타이틀이 표시됩니다.{'\n\n'}
          서브타이틀은 선택적으로 사용할 수 있습니다.
        </CustomText>
      </CustomBottomSheet>

      {/* 3. One Button */}
      <CustomBottomSheet
        ref={oneButtonSheetRef}
        title="버튼 1개"
        subtitle="하단에 버튼이 1개 고정되어 있습니다"
        onClose={() => oneButtonSheetRef.current?.dismiss()}
        buttons={[
          {
            title: '확인',
            type: 'primary',
            onPress: handleConfirm,
          }
        ]}
      >
        <CustomText type="normal" style={{ color: theme.textPrimary }}>
          하단에 버튼이 1개 표시됩니다.{'\n\n'}
          버튼은 Safe Area를 고려하여 배치됩니다.
        </CustomText>
      </CustomBottomSheet>

      {/* 4. Two Buttons */}
      <CustomBottomSheet
        ref={twoButtonsSheetRef}
        title="버튼 2개"
        subtitle="하단에 버튼이 2개 고정되어 있습니다"
        onClose={() => twoButtonsSheetRef.current?.dismiss()}
        buttons={[
          {
            title: '저장',
            type: 'primary',
            onPress: handleSave,
          },
          {
            title: '취소',
            type: 'outline',
            onPress: handleCancel,
          }
        ]}
      >
        <CustomText type="normal" style={{ color: theme.textPrimary }}>
          하단에 버튼이 2개 표시됩니다.{'\n\n'}
          각 버튼은 flex: 1로 동일한 너비를 갖습니다.
        </CustomText>
      </CustomBottomSheet>

      {/* 5. Dynamic Content */}
      <CustomBottomSheet
        ref={dynamicSheetRef}
        title="동적 콘텐츠"
        subtitle="스크롤 가능한 긴 콘텐츠"
        onClose={() => dynamicSheetRef.current?.dismiss()}
        buttons={[
          {
            title: '닫기',
            type: 'primary',
            onPress: () => dynamicSheetRef.current?.dismiss(),
          }
        ]}
      >
        {[...Array(20)].map((_, index) => (
          <View key={index} style={styles.listItem}>
            <CustomText type="normal" style={{ color: theme.textPrimary }}>
              📄 항목 {index + 1}
            </CustomText>
          </View>
        ))}
      </CustomBottomSheet>

      {/* 6. Form with Inputs */}
      <CustomBottomSheet
        ref={formSheetRef}
        title="로그인 폼"
        subtitle="이메일과 비밀번호를 입력하세요"
        onClose={handleFormClose}
        buttons={[
          {
            title: '로그인',
            type: 'primary',
            onPress: handleFormSubmit,
            loading: isLoading,
            disabled: isLoading,
          },
          {
            title: '취소',
            type: 'outline',
            onPress: handleFormClose,
            disabled: isLoading,
          }
        ]}
        keyboardBehavior="extend"
      >
        <View style={styles.formContainer}>
          <NeonInputBottomSheet
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="이메일"
            leftIcon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isLoading}
          />
          
          <NeonInputBottomSheet
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            placeholder="비밀번호"
            leftIcon="lock-outline"
            secureTextEntry
            disabled={isLoading}
          />

          <CustomText type="small" style={{ color: theme.textTertiary, marginTop: scale(12) }}>
            💡 키보드가 나타나면 바텀시트가 자동으로 확장됩니다.
          </CustomText>
        </View>
      </CustomBottomSheet>

      {/* 🔐 Forgot Password Sheet */}
      <ForgotPasswordSheet
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={() => {
          Alert.alert('성공', '비밀번호가 변경되었습니다!');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: platformPadding(20),
    paddingHorizontal: platformPadding(20),
  },
  header: {
    marginBottom: scale(32),
  },
  section: {
    marginBottom: scale(32),
  },
  sectionTitle: {
    marginBottom: scale(16),
  },
  testButton: {
    marginBottom: scale(12),
  },
  listItem: {
    paddingVertical: platformPadding(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  formContainer: {
    gap: scale(16),
  },
});

export default BottomSheetTestScreen;

