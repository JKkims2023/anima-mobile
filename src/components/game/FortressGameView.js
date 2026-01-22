/**
 * 🎮 FortressGameView - Compact Artillery Game with LLM
 * 
 * Features:
 * - Random terrain generation (4-6 peaks/valleys)
 * - Turn-based gameplay (User vs AI Persona)
 * - Virtual landscape mode (rotated 90deg)
 * - Simple, retro-style UI
 * 
 * @author JK & Hero Nexus AI
 * @date 2026-01-22
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polygon, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════
// Terrain Generation (랜덤 지형 생성)
// ═══════════════════════════════════════════════════════════════════════════
const generateTerrain = (width, height) => {
  const numPoints = 8; // 지형 구간 개수 (4-6개 peak/valley)
  const points = [];
  const baseY = height * 0.7; // 기본 지면 높이 (화면의 70%)
  const minY = height * 0.4; // 최소 높이 (산 꼭대기)
  const maxY = height * 0.8; // 최대 높이 (골짜기)

  // 시작점 (왼쪽 끝)
  points.push({ x: 0, y: baseY });

  // 중간 지점들 (랜덤 높이)
  for (let i = 1; i < numPoints - 1; i++) {
    const x = (width / (numPoints - 1)) * i;
    const y = minY + Math.random() * (maxY - minY);
    points.push({ x, y });
  }

  // 끝점 (오른쪽 끝)
  points.push({ x: width, y: baseY });

  // SVG Path 생성 (부드러운 곡선)
  let pathData = `M ${points[0].x},${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    // Quadratic Bezier Curve (부드러운 곡선)
    const controlX = (prev.x + curr.x) / 2;
    const controlY = (prev.y + curr.y) / 2;
    pathData += ` Q ${controlX},${controlY} ${curr.x},${curr.y}`;
  }

  // 지형 아래를 채우기 위해 하단으로 선 긋기
  pathData += ` L ${width},${height} L 0,${height} Z`;

  return { pathData, points };
};

// ═══════════════════════════════════════════════════════════════════════════
// Get Y position on terrain (지형 위의 Y좌표 계산)
// ═══════════════════════════════════════════════════════════════════════════
const getTerrainY = (x, points) => {
  // 선형 보간으로 지형의 Y좌표 계산
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    if (x >= p1.x && x <= p2.x) {
      // 두 점 사이의 Y값을 선형 보간
      const ratio = (x - p1.x) / (p2.x - p1.x);
      return p1.y + (p2.y - p1.y) * ratio;
    }
  }
  
  return points[points.length - 1].y;
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
const FortressGameView = ({ visible, onClose, persona }) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets(); // ⭐ SafeArea for system bars

  // Game state
  const [terrain, setTerrain] = useState(null);
  const [userTank, setUserTank] = useState(null);
  const [aiTank, setAiTank] = useState(null);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(75);
  const [wind, setWind] = useState(0);

  // ⭐ Chip expansion state (툴팁 형태 활성화)
  const [angleChipExpanded, setAngleChipExpanded] = useState(false);
  const [powerChipExpanded, setPowerChipExpanded] = useState(false);

  // Animation
  const fadeAnim = useSharedValue(0);
  
  // ⭐ Chip animations (for control chips)
  const chipOpacity = useSharedValue(0);
  const angleChipWidth = useSharedValue(scale(48)); // 초기: 아이콘만
  const powerChipWidth = useSharedValue(scale(48)); // 초기: 아이콘만
  
  // ⭐ Avatar animations
  const avatarOpacity = useSharedValue(0);
  
  // ⭐ Projectile (발사체) state & animations
  const [projectile, setProjectile] = useState(null); // { x, y } or null
  const [isAnimating, setIsAnimating] = useState(false);
  const projectileX = useSharedValue(0);
  const projectileY = useSharedValue(0);
  const projectileOpacity = useSharedValue(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialize Game (게임 초기화)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      initializeGame();
      fadeAnim.value = withTiming(1, { duration: 400 });
      
      // ⭐ Avatars fade-in
      avatarOpacity.value = 0;
      avatarOpacity.value = withTiming(1, { duration: 400, delay: 100 });
      
      // ⭐ Chips fade-in with delay
      chipOpacity.value = 0;
      chipOpacity.value = withTiming(1, { duration: 300, delay: 200 });
      
      // ⭐ Reset chip state
      setAngleChipExpanded(false);
      setPowerChipExpanded(false);
      angleChipWidth.value = scale(48);
      powerChipWidth.value = scale(48);
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      avatarOpacity.value = withTiming(0, { duration: 200 });
      chipOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // ⭐ Chip expansion handlers
  const toggleAngleChip = useCallback(() => {
    HapticService.light();
    const newState = !angleChipExpanded;
    setAngleChipExpanded(newState);
    
    if (newState) {
      // 확장: 아이콘 + 컨트롤 버튼
      angleChipWidth.value = withSpring(scale(160), { damping: 15, stiffness: 200 });
      // 다른 칩 닫기
      if (powerChipExpanded) {
        setPowerChipExpanded(false);
        powerChipWidth.value = withSpring(scale(48), { damping: 15, stiffness: 200 });
      }
    } else {
      // 축소: 아이콘만
      angleChipWidth.value = withSpring(scale(48), { damping: 15, stiffness: 200 });
    }
  }, [angleChipExpanded, powerChipExpanded, angleChipWidth, powerChipWidth]);

  const togglePowerChip = useCallback(() => {
    HapticService.light();
    const newState = !powerChipExpanded;
    setPowerChipExpanded(newState);
    
    if (newState) {
      // 확장: 아이콘 + 컨트롤 버튼
      powerChipWidth.value = withSpring(scale(160), { damping: 15, stiffness: 200 });
      // 다른 칩 닫기
      if (angleChipExpanded) {
        setAngleChipExpanded(false);
        angleChipWidth.value = withSpring(scale(48), { damping: 15, stiffness: 200 });
      }
    } else {
      // 축소: 아이콘만
      powerChipWidth.value = withSpring(scale(48), { damping: 15, stiffness: 200 });
    }
  }, [powerChipExpanded, angleChipExpanded, powerChipWidth, angleChipWidth]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Physics Engine (물리 엔진)
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateTrajectory = useCallback((startX, startY, angle, power, wind) => {
    console.log('🎯 [Physics] Calculating trajectory...');
    console.log(`   Start: (${startX.toFixed(1)}, ${startY.toFixed(1)})`);
    console.log(`   Angle: ${angle}°, Power: ${power}%, Wind: ${wind}m/s`);
    
    // ⭐ 물리 상수
    const GRAVITY = 980; // 픽셀 기준 중력 가속도 (cm/s² → px/s²)
    const MAX_VELOCITY = 500; // 최대 초속도 (px/s)
    const TIME_STEP = 0.02; // 20ms per frame (50 FPS)
    const MAX_TIME = 5; // 최대 5초 시뮬레이션
    
    // ⭐ 초속도 계산 (power: 0~100 → velocity: 0~MAX_VELOCITY)
    const initialVelocity = (power / 100) * MAX_VELOCITY;
    
    // ⭐ 각도를 라디안으로 변환
    const angleRad = (angle * Math.PI) / 180;
    
    // ⭐ 초속도 분해 (x, y 성분)
    let vx = initialVelocity * Math.cos(angleRad); // 수평 속도
    let vy = -initialVelocity * Math.sin(angleRad); // 수직 속도 (위쪽이 -)
    
    // ⭐ 바람 영향 (수평 속도에 추가)
    const windEffect = wind * 8; // wind: -10~+10 → -80~+80 px/s
    vx += windEffect;
    
    // ⭐ 궤적 포인트 배열
    const trajectory = [];
    let x = startX;
    let y = startY;
    let t = 0;
    
    // ⭐ 시뮬레이션 (충돌 또는 시간 초과까지)
    while (t < MAX_TIME) {
      trajectory.push({ x, y, t });
      
      // 다음 프레임 위치 계산
      x += vx * TIME_STEP;
      y += vy * TIME_STEP;
      
      // 중력 적용 (수직 속도 증가)
      vy += GRAVITY * TIME_STEP;
      
      // 화면 밖으로 나가면 중단 (회전된 화면 기준)
      if (y > SCREEN_WIDTH || x < 0 || x > SCREEN_HEIGHT) {
        break;
      }
      
      t += TIME_STEP;
    }
    
    console.log(`🎯 [Physics] Trajectory calculated: ${trajectory.length} points, duration: ${t.toFixed(2)}s`);
    return trajectory;
  }, []);

  const initializeGame = () => {
    // 가로 화면 기준 크기
    const gameWidth = SCREEN_HEIGHT - 100;
    const gameHeight = 300;

    // 지형 생성
    const terrainData = generateTerrain(gameWidth, gameHeight);
    setTerrain(terrainData);

    // 탱크 배치 (왼쪽: 유저, 오른쪽: AI)
    const userX = gameWidth * 0.15;
    const aiX = gameWidth * 0.85;
    const userY = getTerrainY(userX, terrainData.points);
    const aiY = getTerrainY(aiX, terrainData.points);

    setUserTank({ x: userX, y: userY - 10, hp: 100 });
    setAiTank({ x: aiX, y: aiY - 10, hp: 100 });

    // 바람 (랜덤)
    setWind(Math.floor(Math.random() * 21) - 10); // -10 ~ 10
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════
  const handleFire = useCallback(() => {
    if (isAnimating) {
      console.log('🚫 [Fire] Already animating, ignored');
      return;
    }
    
    if (!userTank) {
      console.error('❌ [Fire] User tank not initialized');
      return;
    }
    
    HapticService.medium();
    console.log('🔥 [Fire] Firing!');
    console.log(`   Angle: ${angle}°, Power: ${power}%, Wind: ${wind}m/s`);
    
    // ⭐ 1. 궤적 계산
    const trajectory = calculateTrajectory(
      userTank.x,
      userTank.y,
      angle,
      power,
      wind
    );
    
    if (trajectory.length === 0) {
      console.error('❌ [Fire] Trajectory calculation failed');
      return;
    }
    
    // ⭐ 2. 애니메이션 준비
    setIsAnimating(true);
    setProjectile({ x: trajectory[0].x, y: trajectory[0].y });
    
    projectileX.value = trajectory[0].x;
    projectileY.value = trajectory[0].y;
    projectileOpacity.value = 0;
    projectileOpacity.value = withTiming(1, { duration: 100 });
    
    // ⭐ 3. 궤적을 따라 이동 (순차 애니메이션)
    let currentIndex = 0;
    const animationInterval = setInterval(() => {
      currentIndex++;
      
      if (currentIndex >= trajectory.length) {
        // 궤적 종료
        clearInterval(animationInterval);
        projectileOpacity.value = withTiming(0, { duration: 200 });
        
        setTimeout(() => {
          setProjectile(null);
          setIsAnimating(false);
          console.log('✅ [Fire] Animation complete');
          HapticService.light();
          // TODO: Step 3에서 충돌 감지 & 데미지 처리 추가
        }, 200);
        return;
      }
      
      const point = trajectory[currentIndex];
      projectileX.value = point.x;
      projectileY.value = point.y;
      setProjectile({ x: point.x, y: point.y });
    }, 20); // 50 FPS (20ms per frame)
    
  }, [isAnimating, angle, power, wind, userTank, calculateTrajectory, projectileX, projectileY, projectileOpacity]);

  const handleClose = useCallback(() => {
    HapticService.light();
    onClose?.();
  }, [onClose]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Animated Styles
  // ═══════════════════════════════════════════════════════════════════════════
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));
  
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
  }));
  
  const chipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chipOpacity.value,
  }));
  
  const angleChipAnimatedStyle = useAnimatedStyle(() => ({
    width: angleChipWidth.value,
  }));
  
  const powerChipAnimatedStyle = useAnimatedStyle(() => ({
    width: powerChipWidth.value,
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible || !terrain) return null;

  // ⭐ Calculate safe game dimensions (accounting for SafeArea in landscape)
  // 90도 회전: 회전된 left/right = 실제 top/bottom, 회전된 top/bottom = 실제 left/right
  
  // 회전된 가로(width) = 실제 세로(height) → top/bottom 여백 제거
  const gameWidth = SCREEN_HEIGHT - (insets.top + insets.bottom) - scale(20);
  
  // 회전된 세로(height) = 실제 가로(width) → left/right 여백 제거
  const gameHeight = SCREEN_WIDTH - (insets.left + insets.right) - verticalScale(40); // 헤더 공간

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.outerContainer, containerAnimatedStyle]}>
        {/* 회전된 게임 영역 (가상 가로 모드) */}
        <View style={[
          styles.rotatedContainer,
          {
            // ⭐ SafeArea 적용 (90도 회전 시 매핑)
            // 회전된 Left → 실제 Top, 회전된 Right → 실제 Bottom
            paddingLeft: insets.top,      // 회전된 왼쪽 = 실제 상단
            paddingRight: insets.bottom,  // 회전된 오른쪽 = 실제 하단
            paddingTop: insets.left,      // 회전된 상단 = 실제 왼쪽
            paddingBottom: insets.right,  // 회전된 하단 = 실제 오른쪽
          }
        ]}>
          {/* 게임 컨텐츠 */}
          <View style={styles.gameContent}>
            {/* 상단: 간소화된 헤더 */}
            <View style={styles.gameHeader}>
              <CustomText style={styles.gameTitle}>🎮 FORTRESS</CustomText>
              <CustomText style={styles.windText}>
                💨 {wind > 0 ? `→${wind}` : wind < 0 ? `←${Math.abs(wind)}` : '0'}m/s
              </CustomText>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="close-circle" size={moderateScale(28)} color="#FF6B9D" />
              </TouchableOpacity>
            </View>

            {/* 중앙: 게임 화면 (SVG) */}
            <View style={styles.gameArea}>
              <Svg
                width={gameWidth}
                height={gameHeight}
                style={styles.svg}
              >
                {/* 배경 (하늘) */}
                <Path
                  d={`M 0,0 L ${gameWidth},0 L ${gameWidth},${gameHeight} L 0,${gameHeight} Z`}
                  fill="#0a0a15"
                />

                {/* 지형 */}
                <Path
                  d={terrain.pathData}
                  fill="#2c5f2d" // 녹색 땅
                  stroke="#8B4513" // 갈색 테두리
                  strokeWidth="2"
                />

                {/* 지형 테두리 강조 (상단만) */}
                <Path
                  d={terrain.pathData.split(' L ')[0]} // 지형 상단 곡선만
                  fill="none"
                  stroke="#a0d468" // 밝은 녹색
                  strokeWidth="3"
                />

                {/* 유저 탱크 (삼각형) */}
                {userTank && (
                  <Polygon
                    points={`${userTank.x},${userTank.y} ${userTank.x - 8},${userTank.y + 12} ${userTank.x + 8},${userTank.y + 12}`}
                    fill="#FF6B9D" // ANIMA 핑크
                    stroke="#FFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* AI 탱크 (삼각형) */}
                {aiTank && (
                  <Polygon
                    points={`${aiTank.x},${aiTank.y} ${aiTank.x - 8},${aiTank.y + 12} ${aiTank.x + 8},${aiTank.y + 12}`}
                    fill="#A78BFA" // ANIMA 퍼플
                    stroke="#FFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* ⭐ 발사체 (Projectile) */}
                {projectile && (
                  <Circle
                    cx={projectile.x}
                    cy={projectile.y}
                    r="6"
                    fill="#FF6B9D" // 사용자 색상
                    stroke="#FFF"
                    strokeWidth="2"
                    opacity={isAnimating ? 1 : 0}
                  />
                )}
              </Svg>
            </View>

            {/* ⭐ 상단: 아바타 오버레이 */}
            <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
              {/* 좌측: 사용자 아바타 */}
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatar, styles.userAvatar]}>
                  <CustomText style={styles.avatarEmoji}>👤</CustomText>
                </View>
                <View style={styles.hpBarContainer}>
                  <View style={[styles.hpBarFill, { width: `${userTank?.hp || 100}%`, backgroundColor: '#FF6B9D' }]} />
                </View>
                <CustomText style={styles.hpText}>{userTank?.hp || 100} HP</CustomText>
              </View>

              {/* 우측: 페르소나 아바타 */}
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatar, styles.aiAvatar]}>
                  <CustomText style={styles.avatarEmoji}>🤖</CustomText>
                </View>
                <View style={styles.hpBarContainer}>
                  <View style={[styles.hpBarFill, { width: `${aiTank?.hp || 100}%`, backgroundColor: '#A78BFA' }]} />
                </View>
                <CustomText style={styles.hpText}>{aiTank?.hp || 100} HP</CustomText>
              </View>
            </Animated.View>

            {/* ⭐ 하단 중앙: 컨트롤 칩셋 (오버레이) */}
            <Animated.View style={[styles.controlChipsContainer, chipAnimatedStyle]}>
              {/* 각도 칩 (툴팁 형태) */}
              <TouchableOpacity
                style={styles.chipTouchArea}
                onPress={toggleAngleChip}
                activeOpacity={0.8}
                disabled={isAnimating}
              >
                <Animated.View style={[styles.controlChip, angleChipAnimatedStyle]}>
                  <MaterialIcon name="angle-acute" size={moderateScale(20)} color="#60A5FA" />
                  
                  {angleChipExpanded && (
                    <View style={styles.chipContent}>
                      <TouchableOpacity
                        style={styles.chipButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          HapticService.light();
                          setAngle(Math.max(0, angle - 5));
                        }}
                      >
                        <Icon name="remove" size={moderateScale(16)} color="#FFF" />
                      </TouchableOpacity>
                      <CustomText style={styles.chipValue}>{angle}°</CustomText>
                      <TouchableOpacity
                        style={styles.chipButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          HapticService.light();
                          setAngle(Math.min(90, angle + 5));
                        }}
                      >
                        <Icon name="add" size={moderateScale(16)} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>

              {/* 발사 버튼 (중앙) */}
              <TouchableOpacity 
                style={[styles.fireChip, isAnimating && styles.fireChipDisabled]} 
                onPress={handleFire}
                disabled={isAnimating}
              >
                <Icon name="rocket" size={moderateScale(26)} color="#FFF" />
              </TouchableOpacity>

              {/* 파워 칩 (툴팁 형태) */}
              <TouchableOpacity
                style={styles.chipTouchArea}
                onPress={togglePowerChip}
                activeOpacity={0.8}
                disabled={isAnimating}
              >
                <Animated.View style={[styles.controlChip, powerChipAnimatedStyle]}>
                  <MaterialIcon name="flash" size={moderateScale(20)} color="#FFA500" />
                  
                  {powerChipExpanded && (
                    <View style={styles.chipContent}>
                      <TouchableOpacity
                        style={styles.chipButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          HapticService.light();
                          setPower(Math.max(0, power - 5));
                        }}
                      >
                        <Icon name="remove" size={moderateScale(16)} color="#FFF" />
                      </TouchableOpacity>
                      <CustomText style={styles.chipValue}>{power}%</CustomText>
                      <TouchableOpacity
                        style={styles.chipButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          HapticService.light();
                          setPower(Math.min(100, power + 5));
                        }}
                      >
                        <Icon name="add" size={moderateScale(16)} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatedContainer: {
    width: SCREEN_HEIGHT, // ⭐ 가로 모드
    height: SCREEN_WIDTH,
    transform: [{ rotate: '90deg' }],
    backgroundColor: '#1a1a2e',
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  gameContent: {
    flex: 1,
    paddingTop: scale(10),
    paddingLeft: scale(10),
    paddingRight: scale(10),
    paddingBottom: scale(5), // ⭐ Bottom(실제 Left) 최소화
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(5), // ⭐ 여백 축소
    paddingHorizontal: scale(5),
  },
  gameTitle: {
    fontSize: moderateScale(18), // ⭐ 크기 축소
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  windText: {
    fontSize: moderateScale(12), // ⭐ 크기 축소
    color: '#60A5FA',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: scale(4), // ⭐ 패딩 축소
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    borderRadius: moderateScale(10),
    marginBottom: verticalScale(3), // ⭐ 여백 최소화
    overflow: 'hidden',
  },
  svg: {
    backgroundColor: '#0a0a15',
  },
  
  // ⭐ NEW: Avatar Overlay (상단 좌우 오버레이)
  avatarContainer: {
    position: 'absolute',
    top: verticalScale(40), // 헤더 아래
    left: scale(15),
    right: scale(15),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: verticalScale(4),
  },
  avatar: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
  userAvatar: {
    borderColor: '#FF6B9D', // 사용자: 핑크
  },
  aiAvatar: {
    borderColor: '#A78BFA', // 페르소나: 퍼플
  },
  avatarEmoji: {
    fontSize: moderateScale(28),
  },
  hpBarContainer: {
    width: scale(56),
    height: verticalScale(6),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: verticalScale(3),
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: verticalScale(3),
  },
  hpText: {
    fontSize: moderateScale(11),
    fontWeight: 'bold',
    color: '#FFF',
  },
  
  // ⭐ NEW: Control Chips (하단 중앙 오버레이)
  controlChipsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: scale(10), // ⭐ 간격 최소화 (실제 디바이스 기준 Left)
    flexDirection: 'row', // ⭐ 가로 배치
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(12), // 칩 간격
  },
  chipTouchArea: {
    // 터치 영역 확장을 위한 컨테이너
  },
  controlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: moderateScale(24),
    height: scale(48), // ⭐ 고정 높이
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    gap: scale(6),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    overflow: 'hidden', // ⭐ 애니메이션 부드럽게
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginLeft: scale(4),
  },
  chipButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255, 107, 157, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipValue: {
    fontSize: moderateScale(14),
    color: '#FFF',
    fontWeight: 'bold',
    minWidth: scale(40),
    textAlign: 'center',
  },
  fireChip: {
    width: scale(56), // ⭐ 약간 작게 (중앙 배치용)
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  fireChipDisabled: {
    backgroundColor: 'rgba(255, 107, 157, 0.4)', // 비활성화 시 투명도
    opacity: 0.5,
  },
});

export default FortressGameView;
