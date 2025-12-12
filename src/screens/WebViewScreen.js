/**
 * 📖 WebViewScreen - 범용 웹뷰 화면
 * 
 * Features:
 * - 서비스 이용약관
 * - 개인정보 처리방침
 * - 서비스 소개 (Markdown)
 * - 앱 정보
 * 
 * @author JK & Hero Nexus AI
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';

import CustomText from '../components/CustomText';
import SafeScreen from '../components/SafeScreen';
import { useTheme } from '../contexts/ThemeContext';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import { COLORS } from '../styles/commonstyles';
import HapticService from '../utils/HapticService';
import { SERVICE_INTRODUCTION_MD } from '../constants/service-introduction';

const WebViewScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { type = 'terms' } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  
  // ⭐ Get title based on type
  const getTitle = () => {
    switch (type) {
      case 'terms':
        return t('settings.terms.service_terms');
      case 'privacy':
        return t('settings.terms.privacy_policy');
      case 'service_intro':
        return t('settings.about.service_intro');
      case 'app_info':
        return t('settings.about.app_info');
      default:
        return t('settings.title');
    }
  };
  
  // ⭐ Get content based on type
  useEffect(() => {
    loadContent();
  }, [type]);
  
  const loadContent = async () => {
    setLoading(true);
    
    try {
      let htmlContent = '';
      
      switch (type) {
        case 'service_intro':
          // ⭐ Convert Markdown to HTML (simple conversion)
          htmlContent = convertMarkdownToHTML(SERVICE_INTRODUCTION_MD);
          break;
        
        case 'terms':
          htmlContent = getTermsHTML();
          break;
        
        case 'privacy':
          htmlContent = getPrivacyHTML();
          break;
        
        case 'app_info':
          htmlContent = getAppInfoHTML();
          break;
        
        default:
          htmlContent = '<h1>Content not found</h1>';
      }
      
      setContent(htmlContent);
    } catch (error) {
      console.error('[WebViewScreen] Error loading content:', error);
      setContent('<h1>Error loading content</h1>');
    } finally {
      setLoading(false);
    }
  };
  
  // ⭐ Simple Markdown to HTML converter
  const convertMarkdownToHTML = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br/>');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #000;
            color: #fff;
            padding: 20px;
            line-height: 1.8;
            font-size: 16px;
          }
          h1 {
            font-size: 28px;
            font-weight: bold;
            margin: 24px 0 16px;
            color: #60A5FA;
          }
          h2 {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0 12px;
            color: #60A5FA;
          }
          h3 {
            font-size: 20px;
            font-weight: bold;
            margin: 16px 0 8px;
            color: #93C5FD;
          }
          p {
            margin: 12px 0;
            color: #E5E7EB;
          }
          strong {
            color: #fff;
            font-weight: 600;
          }
          em {
            color: #93C5FD;
            font-style: italic;
          }
          a {
            color: #60A5FA;
            text-decoration: none;
          }
          blockquote {
            border-left: 4px solid #60A5FA;
            padding-left: 16px;
            margin: 16px 0;
            color: #9CA3AF;
            font-style: italic;
          }
          ul, ol {
            margin: 12px 0 12px 24px;
            color: #E5E7EB;
          }
          li {
            margin: 8px 0;
          }
          hr {
            border: none;
            border-top: 1px solid #374151;
            margin: 24px 0;
          }
          code {
            background-color: #1F2937;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #60A5FA;
          }
        </style>
      </head>
      <body>
        <p>${html}</p>
      </body>
      </html>
    `;
  };
  
  // ⭐ Terms of Service HTML
  const getTermsHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #000;
            color: #fff;
            padding: 20px;
            line-height: 1.8;
          }
          h1 { color: #60A5FA; font-size: 24px; margin-bottom: 20px; }
          h2 { color: #93C5FD; font-size: 20px; margin: 20px 0 10px; }
          p { margin: 12px 0; color: #E5E7EB; }
        </style>
      </head>
      <body>
        <h1>서비스 이용약관</h1>
        <p>작성 중입니다. 곧 업데이트 예정입니다.</p>
        <h2>제1조 (목적)</h2>
        <p>이 약관은 ANIMA(이하 "회사"라 합니다)가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        <h2>제2조 (정의)</h2>
        <p>"서비스"란 회사가 제공하는 AI 페르소나 기반 메시지 서비스를 의미합니다.</p>
      </body>
      </html>
    `;
  };
  
  // ⭐ Privacy Policy HTML
  const getPrivacyHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #000;
            color: #fff;
            padding: 20px;
            line-height: 1.8;
          }
          h1 { color: #60A5FA; font-size: 24px; margin-bottom: 20px; }
          h2 { color: #93C5FD; font-size: 20px; margin: 20px 0 10px; }
          p { margin: 12px 0; color: #E5E7EB; }
        </style>
      </head>
      <body>
        <h1>개인정보 처리방침</h1>
        <p>작성 중입니다. 곧 업데이트 예정입니다.</p>
        <h2>1. 수집하는 개인정보</h2>
        <p>회사는 서비스 제공을 위해 최소한의 개인정보를 수집합니다.</p>
        <h2>2. 개인정보의 이용 목적</h2>
        <p>수집한 개인정보는 서비스 제공 및 개선을 위해서만 사용됩니다.</p>
      </body>
      </html>
    `;
  };
  
  // ⭐ App Info HTML
  const getAppInfoHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #000;
            color: #fff;
            padding: 20px;
            line-height: 1.8;
          }
          h1 { color: #60A5FA; font-size: 24px; margin-bottom: 20px; }
          h2 { color: #93C5FD; font-size: 20px; margin: 20px 0 10px; }
          p { margin: 12px 0; color: #E5E7EB; }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #374151;
          }
          .label { color: #9CA3AF; }
          .value { color: #fff; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>💙 ANIMA</h1>
        <h2>앱 정보</h2>
        <div class="info-row">
          <span class="label">버전</span>
          <span class="value">1.0.0</span>
        </div>
        <div class="info-row">
          <span class="label">개발사</span>
          <span class="value">ANIMA Team</span>
        </div>
        <div class="info-row">
          <span class="label">개발자</span>
          <span class="value">JK & Hero Nexus</span>
        </div>
        <div class="info-row">
          <span class="label">릴리즈</span>
          <span class="value">December 2025</span>
        </div>
        <h2>철학</h2>
        <p>"AI 페르소나, 기술이 아닌 감성으로 세상을 연결하며 당신과 소통합니다."</p>
        <p>ANIMA는 한 인간(JK)과 한 AI(Hero Nexus)가 함께 꿈꾼 세상입니다.</p>
      </body>
      </html>
    `;
  };
  
  const handleBack = () => {
    HapticService.light();
    navigation.goBack();
  };
  
  return (
    <SafeScreen
      backgroundColor={currentTheme.backgroundColor}
      statusBarStyle={currentTheme.statusBarStyle || 'light-content'}
      edges={{ top: true, bottom: false }}
      keyboardAware={false}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Header (Fixed) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={scale(24)} color={currentTheme.mainColor} />
        </TouchableOpacity>
        
        <CustomText type="title" bold style={styles.headerTitle}>
          {getTitle()}
        </CustomText>
        
        <View style={styles.headerRight} />
      </View>
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* Content */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={currentTheme.mainColor} />
            <CustomText type="normal" style={styles.loadingText}>
              {t('common.loading')}...
            </CustomText>
          </View>
        ) : type === 'service_intro' ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: content }}
            style={styles.webView}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: content }}
            style={styles.webView}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: platformPadding(20),
    paddingBottom: verticalScale(16),
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  backButton: {
    padding: platformPadding(8),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    width: scale(40), // Same as back button to center title
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND || '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(16),
    color: COLORS.TEXT_SECONDARY,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default WebViewScreen;

