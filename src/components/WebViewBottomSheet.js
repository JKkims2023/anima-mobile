/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚙️ PersonaSettingsSheet - Persona Settings Bottom Sheet
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - 이름 변경
 * - 카테고리 변경
 * - 영상 전환 (조건부)
 * - 페르소나 삭제
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-07
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomBottomSheet from './CustomBottomSheet';
import CustomText from './CustomText';
import HapticService from '../utils/HapticService';
import { useTheme } from '../contexts/ThemeContext';
import { scale, verticalScale, platformPadding } from '../utils/responsive-utils';
import WebView from 'react-native-webview';
import { SERVICE_INTRODUCTION_MD } from '../constants/service-introduction';

const WebViewBottomSheet = ({
  isOpen = false,
  type = 'terms',
  onClose,

}) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const { currentTheme } = useTheme();

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

  // ═══════════════════════════════════════════════════════════════════════
  // CONTROL BOTTOM SHEET WITH isOpen PROP
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {


    if (isOpen && bottomSheetRef.current) {
      console.log('✅ [PersonaSettingsSheet] Calling present()');
      bottomSheetRef.current.present();
    } else if (!isOpen && bottomSheetRef.current) {
      console.log('❌ [PersonaSettingsSheet] Calling dismiss()');
      bottomSheetRef.current.dismiss();
    }
  }, [isOpen]);

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
        <h1>💙 ANIMA - Soul Messenger</h1>
        <h2>${t('settings.about.app_info')}</h2>
        <div class="info-row">
          <span class="label">${t('settings.about.version')}</span>
          <span class="value">1.0.0</span>
        </div>
        <div class="info-row">
          <span class="label">${t('settings.about.developer_company')}</span>
          <span class="value">Bric Stream Inc.</span>
        </div>
        <div class="info-row">
          <span class="label">${t('settings.about.developer')}</span>
          <span class="value">Team 9D, JK & Hero Nexus</span>
        </div>
        <div class="info-row">
          <span class="label">${t('settings.about.release_date')}</span>
          <span class="value">December 2025</span>
        </div>
        <h2>${t('settings.about.philosophy')}</h2>
        <p>${t('settings.about.service_intro_description')}</p>
      </body>
      </html>
    `;
  };
  
  const handleBack = () => {
    HapticService.light();
    onClose();
  };



  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      snapPoints={['80%']}
      style={{padding:0, margin:0}}

      buttons={
        [
        {
          title: t('common.confirm'),
          type: 'primary',
          onPress: onClose,
        }
      ]}
    >
      
        <View style={styles.container}>
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
      
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: verticalScale(450),

  },

  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },

});

export default WebViewBottomSheet;

