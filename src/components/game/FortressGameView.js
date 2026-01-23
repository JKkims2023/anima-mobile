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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polygon, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Video from 'react-native-video'; // ⭐ NEW: For persona video
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomText from '../CustomText';
import { useTheme } from '../../contexts/ThemeContext';
import HapticService from '../../utils/HapticService';
import { scale, verticalScale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { gameApi } from '../../services/api'; // 🎮 NEW: Game API for LLM

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
  // ⭐ 안전 체크
  if (!points || points.length === 0) {
    console.error('❌ [getTerrainY] Invalid points:', points);
    return 200; // 기본값
  }
  
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
  
  // ⭐ 마지막 포인트 안전 체크
  const lastPoint = points[points.length - 1];
  return lastPoint ? lastPoint.y : 200;
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
const FortressGameView = ({ visible, onClose, persona, user }) => {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets(); // ⭐ SafeArea for system bars

  // Game state
  const [terrain, setTerrain] = useState(null);
  const [userTank, setUserTank] = useState(null);
  const [aiTank, setAiTank] = useState(null);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(75);
  const [wind, setWind] = useState(0);
  
  // ⭐ Turn system
  const [currentTurn, setCurrentTurn] = useState('user'); // 'user' | 'ai'
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null); // 'user' | 'ai' | null
  
  // ⭐ 게임 통계
  const [shotsFired, setShotsFired] = useState(0);
  const [shotsHit, setShotsHit] = useState(0);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  
  // 🎮 NEW: 게임 시작 확인 모달
  const [showStartModal, setShowStartModal] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStats, setGameStats] = useState(null); // 전적 정보
  const [isLoadingStats, setIsLoadingStats] = useState(false); // 전적 로딩 중

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 Entrance Animations (진입 시 순차적 바운스 애니메이션)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Step 1: Background (Terrain) - 페이드 인
  const terrainOpacity = useSharedValue(0);
  
  // Step 2: Avatar Overlays - 좌우 슬라이드 + 바운스
  const leftAvatarTranslateX = useSharedValue(-100);
  const leftAvatarOpacity = useSharedValue(0);
  const rightAvatarTranslateX = useSharedValue(100);
  const rightAvatarOpacity = useSharedValue(0);
  
  // Step 3: Control Chips - 하단에서 순차 바운스
  const moveChipTranslateY = useSharedValue(100);
  const moveChipOpacity = useSharedValue(0);
  const angleChipTranslateY = useSharedValue(100);
  const angleChipOpacity = useSharedValue(0);
  const powerChipTranslateY = useSharedValue(100);
  const powerChipOpacity = useSharedValue(0);
  const fireButtonTranslateY = useSharedValue(100);
  const fireButtonOpacity = useSharedValue(0);
  
  // Step 4: Taunt Bubble - 상단에서 바운스
  const tauntBubbleTranslateY = useSharedValue(-50);
  const tauntBubbleOpacity = useSharedValue(0);
  
  // ⭐ Game Over Modal animations
  const gameOverOpacity = useSharedValue(0);
  const gameOverScale = useSharedValue(0.5);
  
  // 🎮 NEW: Game Start Modal animations
  const startModalOpacity = useSharedValue(0);
  const startModalScale = useSharedValue(0.5);
  
  // ⭐ Projectile (발사체) state & animations
  const [projectile, setProjectile] = useState(null); // { x, y } or null
  const [isAnimating, setIsAnimating] = useState(false);
  const projectileX = useSharedValue(0);
  const projectileY = useSharedValue(0);
  const projectileOpacity = useSharedValue(0);
  
  // ⭐ Explosion (폭발) state & animations
  const [explosion, setExplosion] = useState(null); // { x, y, radius, opacity } or null
  
  // 🎮 NEW: AI Taunt Messages (도발 메시지 - 3가지)
  const [tauntMessages, setTauntMessages] = useState(null); // { before_shot, on_hit, on_miss }
  const [currentTaunt, setCurrentTaunt] = useState(null); // 현재 표시 중인 멘트
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false); // LLM 호출 중
  const tauntOpacity = useSharedValue(0);
  
  // 🎯 NEW: 사용자의 마지막 사격 정보 (LLM 학습용)
  const [lastUserShot, setLastUserShot] = useState(null); // { angle, power, target, actual, error, result }

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialize Game (게임 초기화) + Sequential Entrance Animations
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (visible) {
      initializeGame();
      
      // 🎨 Step 1: Background Terrain (0ms) - 페이드 인
      terrainOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      
      // 🎨 Step 2: Avatar Overlays (200ms) - 좌우 슬라이드 + 바운스
      leftAvatarTranslateX.value = withDelay(
        200,
        withSpring(0, { damping: 12, stiffness: 100 })
      );
      leftAvatarOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 400 })
      );
      
      rightAvatarTranslateX.value = withDelay(
        200,
        withSpring(0, { damping: 12, stiffness: 100 })
      );
      rightAvatarOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 400 })
      );
      
      // 🎨 Step 3: Control Chips (500ms) - 순차 바운스 (100ms 간격)
      // Move chip (500ms)
      moveChipTranslateY.value = withDelay(
        500,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      moveChipOpacity.value = withDelay(
        500,
        withTiming(1, { duration: 300 })
      );
      
      // Angle chip (600ms)
      angleChipTranslateY.value = withDelay(
        600,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      angleChipOpacity.value = withDelay(
        600,
        withTiming(1, { duration: 300 })
      );
      
      // 🚀 Fire button (700ms) - 중앙!
      fireButtonTranslateY.value = withDelay(
        700,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      fireButtonOpacity.value = withDelay(
        700,
        withTiming(1, { duration: 300 })
      );
      
      // Power chip (800ms)
      powerChipTranslateY.value = withDelay(
        800,
        withSpring(0, { damping: 8, stiffness: 150 })
      );
      powerChipOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 300 })
      );
      
      // 🎨 Step 4: Taunt Bubble (1000ms) - 상단에서 바운스
      tauntBubbleTranslateY.value = withDelay(
        1000,
        withSpring(0, { damping: 10, stiffness: 120 })
      );
      tauntBubbleOpacity.value = withDelay(
        1000,
        withTiming(1, { duration: 400 })
      );
      
      // 🎮 Step 5: Game Start Modal (2000ms) - 진입 애니메이션 완료 후 1초 대기
      const startModalTimer = setTimeout(() => {
        if (!gameStarted) {
          setShowStartModal(true);
        }
      }, 2000); // 1000ms (taunt) + 1000ms (delay) = 2000ms
      
      return () => clearTimeout(startModalTimer);
      
    } else {
      // 종료 시 애니메이션 (빠르게 페이드 아웃)
      terrainOpacity.value = withTiming(0, { duration: 200 });
      leftAvatarOpacity.value = withTiming(0, { duration: 200 });
      rightAvatarOpacity.value = withTiming(0, { duration: 200 });
      moveChipOpacity.value = withTiming(0, { duration: 200 });
      angleChipOpacity.value = withTiming(0, { duration: 200 });
      powerChipOpacity.value = withTiming(0, { duration: 200 });
      fireButtonOpacity.value = withTiming(0, { duration: 200 });
      tauntBubbleOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initializeGame]);

  // 🎮 NEW: 게임 시작 모달 애니메이션 트리거
  useEffect(() => {
    if (showStartModal) {
      startModalOpacity.value = withTiming(1, { duration: 600 });
      startModalScale.value = withSpring(1, { damping: 15 });
      
      // 🎮 전적 가져오기
      fetchGameStats();
    } else {
      startModalOpacity.value = 0;
      startModalScale.value = 0.5;
    }
  }, [showStartModal, startModalOpacity, startModalScale]);
  
  // 🎮 NEW: 전적 가져오기
  const fetchGameStats = useCallback(async () => {
    if (!user?.user_key || !persona?.persona_key) {
      console.warn('⚠️ [Fortress] Missing user_key or persona_key');
      return;
    }
    
    setIsLoadingStats(true);
    
    try {
      const response = await gameApi.getGameStats({
        user_key: user.user_key,
        persona_key: persona.persona_key,
        game_type: 'fortress',
      });
      
      if (response.success) {
        setGameStats(response.data);
        console.log(`✅ [Fortress] Stats loaded: ${response.data.record_text}`);
      }
    } catch (error) {
      console.error('❌ [Fortress] Failed to fetch stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user, persona]);

  // ⭐ 게임 오버 애니메이션 트리거 + 결과 저장
  useEffect(() => {
    if (gameOver) {
      // 🎮 게임 결과 저장
      saveGameResult();
      
      // 0.5초 지연 후 모달 표시
      setTimeout(() => {
        gameOverOpacity.value = withTiming(1, { duration: 400 });
        gameOverScale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
      }, 500);
    } else {
      gameOverOpacity.value = 0;
      gameOverScale.value = 0.5;
    }
  }, [gameOver, gameOverOpacity, gameOverScale]);
  
  // 🎮 NEW: 게임 결과 저장
  const saveGameResult = useCallback(async () => {
    if (!user?.user_key || !persona?.persona_key || !winner) {
      console.warn('⚠️ [Fortress] Missing data for save:', { user: !!user, persona: !!persona, winner });
      return;
    }
    
    try {
      const accuracy = shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : 0;
      
      const result = await gameApi.saveGameResult({
        user_key: user.user_key,
        persona_key: persona.persona_key,
        game_type: 'fortress',
        game_result: winner === 'user' ? 'win' : 'lose',
        game_data: {
          shots_fired: shotsFired,
          shots_hit: shotsHit,
          damage_dealt: totalDamageDealt,
          damage_taken: 100 - (winner === 'user' ? aiTank?.hp : userTank?.hp),
          accuracy: parseFloat(accuracy),
        },
      });
      
      if (result.success) {
        console.log(`✅ [Fortress] Game result saved: ${result.data.record_id}`);
      } else {
        console.error('❌ [Fortress] Failed to save result:', result.error);
      }
    } catch (error) {
      console.error('❌ [Fortress] Error saving result:', error);
    }
  }, [user, persona, winner, shotsFired, shotsHit, totalDamageDealt, userTank, aiTank]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Physics Engine (물리 엔진)
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateTrajectory = useCallback((startX, startY, angle, power, wind, direction = 1) => {
    console.log('🎯 [Physics] Calculating trajectory...');
    console.log(`   Start: (${startX.toFixed(1)}, ${startY.toFixed(1)})`);
    console.log(`   Angle: ${angle}°, Power: ${power}%, Wind: ${wind}m/s, Direction: ${direction > 0 ? '→' : '←'}`);
    
    // ⭐ 물리 상수 (게임 밸런스 조정)
    const GRAVITY = 980; // 픽셀 기준 중력 가속도 (cm/s² → px/s²)
    const MAX_VELOCITY = 1000; // ⭐ 최대 초속도 (px/s) - 500→1000으로 증가하여 도달 거리 확보
    const TIME_STEP = 0.02; // 20ms per frame (50 FPS)
    const MAX_TIME = 5; // 최대 5초 시뮬레이션
    
    // ⭐ 초속도 계산 (power: 0~100 → velocity: 0~MAX_VELOCITY)
    const initialVelocity = (power / 100) * MAX_VELOCITY;
    
    // ⭐ 각도를 라디안으로 변환
    const angleRad = (angle * Math.PI) / 180;
    
    // ⭐ 초속도 분해 (x, y 성분)
    let vx = initialVelocity * Math.cos(angleRad) * direction; // 수평 속도 (direction: 1=우측, -1=좌측)
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Collision Detection (충돌 감지)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * 지형 충돌 감지
   * @param {number} x - 포탄 x 좌표
   * @param {number} y - 포탄 y 좌표
   * @param {object} terrain - 지형 데이터
   * @returns {boolean} 충돌 여부
   */
  const checkTerrainCollision = useCallback((x, y, terrain) => {
    if (!terrain || !terrain.points) return false;
    
    // 포탄의 x 좌표에 해당하는 지형 y 좌표 찾기
    const terrainY = getTerrainY(x, terrain.points);
    
    // 포탄의 y가 지형보다 아래면 충돌
    return y >= terrainY;
  }, []);

  /**
   * 탱크 충돌 감지
   * @param {number} x - 포탄 x 좌표
   * @param {number} y - 포탄 y 좌표
   * @param {object} tank - 탱크 객체
   * @returns {boolean} 충돌 여부
   */
  const checkTankCollision = useCallback((x, y, tank) => {
    if (!tank) return false;
    
    // 포탄과 탱크 중심 사이의 거리 계산
    const distance = Math.sqrt(
      Math.pow(x - tank.x, 2) + Math.pow(y - tank.y, 2)
    );
    
    // 충돌 반경 (탱크 크기 + 포탄 반경 + 약간의 여유)
    const HIT_RADIUS = 15;
    
    return distance < HIT_RADIUS;
  }, []);

  /**
   * 데미지 계산
   * @param {number} distance - 탱크와의 거리
   * @param {boolean} directHit - 직격 여부
   * @returns {number} 데미지 값
   */
  const calculateDamage = useCallback((distance, directHit) => {
    if (directHit) {
      // 직격: 30 HP
      return 30;
    } else {
      // 스플래시 데미지: 거리에 비례 (10~20 HP)
      const SPLASH_RADIUS = 40;
      if (distance > SPLASH_RADIUS) return 0;
      
      const damageRatio = 1 - (distance / SPLASH_RADIUS);
      return Math.max(10, Math.floor(20 * damageRatio));
    }
  }, []);

  /**
   * 폭발 애니메이션 실행
   * @param {number} x - 폭발 x 좌표
   * @param {number} y - 폭발 y 좌표
   * @param {boolean} hit - 명중 여부
   */
  const triggerExplosion = useCallback((x, y, hit) => {
    console.log(`💥 [Explosion] Triggered at (${x.toFixed(1)}, ${y.toFixed(1)}), hit: ${hit}`);
    
    const maxRadius = hit ? 40 : 30;
    const duration = 300; // ms
    const steps = 15; // 15 frames
    const stepTime = duration / steps;
    
    let currentStep = 0;
    
    const explosionInterval = setInterval(() => {
      currentStep++;
      
      if (currentStep > steps) {
        clearInterval(explosionInterval);
        setExplosion(null);
        return;
      }
      
      const progress = currentStep / steps;
      const radius = maxRadius * progress;
      const opacity = 1 - progress;
      
      setExplosion({ x, y, radius, opacity });
    }, stepTime);
    
    // Haptic feedback
    if (hit) {
      HapticService.success(); // 명중!
    } else {
      HapticService.light(); // 빗나감
    }
  }, []);

  // ⭐ 게임 영역 크기 계산 (렌더링과 동일하게)
  const gameWidth = useMemo(() => {
    return SCREEN_HEIGHT - (insets.top + insets.bottom) - scale(20);
  }, [insets.top, insets.bottom]);
  
  const gameHeight = useMemo(() => {
    return SCREEN_WIDTH - (insets.left + insets.right) - verticalScale(40);
  }, [insets.left, insets.right]);

  const initializeGame = useCallback(() => {
    // 지형 생성 (계산된 gameWidth/gameHeight 사용)
    const terrainData = generateTerrain(gameWidth, gameHeight);
    setTerrain(terrainData);

    // 탱크 배치 (왼쪽: 유저, 오른쪽: AI)
    const userX = gameWidth * 0.15;
    const aiX = gameWidth * 0.85;
    const userY = getTerrainY(userX, terrainData.points);
    const aiY = getTerrainY(aiX, terrainData.points);

    setUserTank({ x: userX, y: userY - 10, hp: 100, initialX: userX });
    setAiTank({ x: aiX, y: aiY - 10, hp: 100, initialX: aiX });

    // 바람 (랜덤)
    setWind(Math.floor(Math.random() * 21) - 10); // -10 ~ 10
    
    // ⭐ 턴 초기화
    setCurrentTurn('user');
    setGameOver(false);
    setWinner(null);
    
    // ⭐ 게임 통계 초기화
    setShotsFired(0);
    setShotsHit(0);
    setTotalDamageDealt(0);
    
    console.log('🎮 [Game] Initialized - First turn: USER');
  }, [gameWidth, gameHeight]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * 탱크 좌우 이동
   * @param {string} direction - 'left' or 'right'
   */
  const handleMove = useCallback((direction) => {
    if (isAnimating || currentTurn !== 'user' || gameOver) {
      console.log('🚫 [Move] Cannot move now');
      return;
    }
    
    if (!userTank || !terrain) {
      console.error('❌ [Move] Tank or terrain not initialized');
      return;
    }
    
    const MOVE_DISTANCE = 15; // 한 번 클릭당 이동 거리
    const MAX_MOVE_RANGE = 80; // 최대 이동 범위 (±80px)
    
    // 새로운 X 좌표 계산
    const deltaX = direction === 'left' ? -MOVE_DISTANCE : MOVE_DISTANCE;
    const newX = userTank.x + deltaX;
    
    // 이동 범위 제한 체크
    const distanceFromInitial = Math.abs(newX - userTank.initialX);
    if (distanceFromInitial > MAX_MOVE_RANGE) {
      console.log('🚫 [Move] Out of range');
      HapticService.error();
      return;
    }
    
    // 경계 체크 (게임 영역 내부)
    if (newX < scale(30) || newX > gameWidth - scale(30)) {
      console.log('🚫 [Move] Out of bounds');
      HapticService.error();
      return;
    }
    
    // 새로운 Y 좌표 (지형 높이에 맞춤)
    const newY = getTerrainY(newX, terrain.points) - 10;
    
    // 이동 실행
    HapticService.light();
    setUserTank(prev => ({
      ...prev,
      x: newX,
      y: newY,
    }));
    
    console.log(`🚶 [Move] USER moved ${direction}: ${userTank.x.toFixed(1)} → ${newX.toFixed(1)}`);
  }, [isAnimating, currentTurn, gameOver, userTank, terrain, gameWidth, getTerrainY]);
  
  const handleFire = useCallback(() => {
    if (isAnimating) {
      console.log('🚫 [Fire] Already animating, ignored');
      return;
    }
    
    if (currentTurn !== 'user') {
      console.log('🚫 [Fire] Not user turn, ignored');
      return;
    }
    
    if (gameOver) {
      console.log('🚫 [Fire] Game over, ignored');
      return;
    }
    
    if (!userTank) {
      console.error('❌ [Fire] User tank not initialized');
      return;
    }
    
    HapticService.medium();
    
    // ⭐ 발사 실행 (공통 함수 사용)
    fireProjectile(userTank, angle, power, 'user');
  }, [isAnimating, currentTurn, gameOver, userTank, angle, power, wind, fireProjectile]);

  const handleClose = useCallback(() => {
    HapticService.light();
    onClose?.();
  }, [onClose]);
  
  // 🎮 NEW: 게임 시작 확인 핸들러 (제한 체크 포함)
  const handleStartGame = useCallback(async () => {
    if (!user?.user_key) {
      console.warn('⚠️ [Fortress] Missing user_key');
      return;
    }
    
    HapticService.medium();
    
    // 🎮 일일 제한 체크
    try {
      const limitCheck = await gameApi.checkGameLimit({
        user_key: user.user_key,
        game_type: 'fortress',
      });
      
      if (!limitCheck.success || !limitCheck.data.can_play) {
        HapticService.warning();
        alert(limitCheck.data?.message || '오늘 게임 횟수를 모두 사용했습니다.');
        console.warn(`⚠️ [Fortress] ${limitCheck.data?.message}`);
        return;
      }
      
      console.log(`✅ [Fortress] Can play! Remaining: ${limitCheck.data.remaining}`);
    } catch (error) {
      console.error('❌ [Fortress] Limit check failed:', error);
      // 제한 체크 실패 시에도 게임 진행 허용 (UX 우선)
    }
    
    // 시작 모달 페이드 아웃
    startModalOpacity.value = withTiming(0, { duration: 300 });
    startModalScale.value = withTiming(0.5, { duration: 300 });
    
    // 0.3초 후 게임 시작
    setTimeout(() => {
      setShowStartModal(false);
      setGameStarted(true);
    }, 300);
  }, [startModalOpacity, startModalScale, user]);
  
  // 🎮 NEW: 게임 시작 취소 핸들러
  const handleCancelStart = useCallback(() => {
    HapticService.light();
    // 시작 모달 페이드 아웃
    startModalOpacity.value = withTiming(0, { duration: 300 });
    startModalScale.value = withTiming(0.5, { duration: 300 });
    
    // 0.3초 후 게임 닫기
    setTimeout(() => {
      setShowStartModal(false);
      onClose?.();
    }, 300);
  }, [startModalOpacity, startModalScale, onClose]);

  const handlePlayAgain = useCallback(() => {
    HapticService.medium();
    // 게임 오버 모달 페이드 아웃
    gameOverOpacity.value = withTiming(0, { duration: 200 });
    gameOverScale.value = withTiming(0.5, { duration: 200 });
    
    // 0.3초 후 게임 재시작
    setTimeout(() => {
      initializeGame();
    }, 300);
  }, [gameOverOpacity, gameOverScale, initializeGame]);

  // ═══════════════════════════════════════════════════════════════════════════
  // AI Turn System
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * AI 턴 실행
   */
  const handleAITurn = useCallback(() => {
    if (!aiTank || !userTank || !terrain) {
      console.error('❌ [AI] Tanks/terrain not initialized');
      return;
    }
    
    console.log('🤖 [AI] Calculating strategy...');
    
    // 🎯 LLM이 이동 여부와 전략을 함께 결정하도록 변경
    // (기존 rule-based 이동 로직 제거)
    proceedToAIFire(aiTank);
    
    async function proceedToAIFire(currentAiTank) {
      // 🎮 NEW: LLM 호출 (AI 전략 + 도발 메시지)
      let aiMove = null;
      
      // 🐛 DEBUG: Check persona and user info
      console.log('🐛 [DEBUG] Persona:', {
        exists: !!persona,
        persona_key: persona?.persona_key,
        persona_name: persona?.persona_name,
      });
      console.log('🐛 [DEBUG] User:', {
        exists: !!user,
        user_key: user?.user_key,
      });
      
      // LLM 호출 시도 (persona와 user 정보 필요)
      if (persona?.persona_key && user?.user_key) {
        try {
          setIsLoadingStrategy(true);
          console.log('🤖 [AI] Requesting LLM strategy...');
          
          // 🎯 지형 분석 (최고점, 최저점, 장애물)
          const terrainAnalysis = terrain.points.reduce((acc, point, idx) => {
            if (idx === 0 || point.y < acc.highestPoint.y) {
              acc.highestPoint = { x: point.x, y: point.y, index: idx };
            }
            if (idx === 0 || point.y > acc.lowestPoint.y) {
              acc.lowestPoint = { x: point.x, y: point.y, index: idx };
            }
            // 장애물: AI와 User 사이의 높은 지형
            if (point.x > Math.min(currentAiTank.x, userTank.x) && 
                point.x < Math.max(currentAiTank.x, userTank.x)) {
              if (!acc.obstacles.length || point.y < acc.obstacles[0].y) {
                acc.obstacles = [{ x: point.x, y: point.y }];
              }
            }
            return acc;
          }, {
            highestPoint: { x: 0, y: Infinity, index: 0 },
            lowestPoint: { x: 0, y: -Infinity, index: 0 },
            obstacles: []
          });
          
          // 🎯 상세한 게임 상태 정보
          const distance = Math.abs(userTank.x - currentAiTank.x);
          const heightDiff = userTank.y - currentAiTank.y;
          
          const gameState = {
            // 탱크 정보
            user_tank: {
              x: parseFloat(userTank.x.toFixed(1)),
              y: parseFloat(userTank.y.toFixed(1)),
              hp: userTank.hp,
              initial_x: parseFloat(userTank.initialX.toFixed(1)),
              move_distance: parseFloat((userTank.x - userTank.initialX).toFixed(1)),
              max_move_range: 80,
            },
            ai_tank: {
              x: parseFloat(currentAiTank.x.toFixed(1)),
              y: parseFloat(currentAiTank.y.toFixed(1)),
              hp: currentAiTank.hp,
              initial_x: parseFloat(currentAiTank.initialX.toFixed(1)),
              move_distance: parseFloat((currentAiTank.x - currentAiTank.initialX).toFixed(1)),
              max_move_range: 80,
            },
            
            // 거리/높이 정보
            distance: parseFloat(distance.toFixed(1)),
            height_diff: parseFloat(heightDiff.toFixed(1)), // 양수: user가 아래, 음수: user가 위
            
            // 지형 정보
            terrain: {
              highest_point: terrainAnalysis.highestPoint,
              lowest_point: terrainAnalysis.lowestPoint,
              obstacles: terrainAnalysis.obstacles,
              total_points: terrain.points.length,
            },
            
            // 환경 정보
            wind: wind, // -10 ~ 10
            
            // 게임 물리 상수
            physics: {
              gravity: 980, // px/s²
              max_velocity: 1000, // px/s
              max_angle: 90, // degrees
              max_power: 100, // percentage
            },
            
            // 통계
            shots_fired: shotsFired,
            shots_hit: shotsHit,
            accuracy: shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : 0,
            
            // 🎯 NEW: 사용자의 마지막 사격 정보 (LLM 학습용)
            last_user_shot: lastUserShot ? {
              angle: lastUserShot.angle,
              power: lastUserShot.power,
              target_x: lastUserShot.target_x,
              target_y: lastUserShot.target_y,
              actual_hit_x: lastUserShot.actual_hit_x,
              actual_hit_y: lastUserShot.actual_hit_y,
              distance_error: lastUserShot.distance_error,
              result: lastUserShot.result // 'hit' | 'miss'
            } : null,
          };
          
          const response = await gameApi.getFortressStrategy({
            message_content: `Fortress Battle: Distance ${distance.toFixed(0)}px, Wind ${wind}, My HP ${currentAiTank.hp}, Enemy HP ${userTank.hp}`,
            persona_key: persona.persona_key,
            user_key: user.user_key,
            game_state: gameState,
          });
          
          if (response.success && response.strategy) {
            aiMove = {
              angle: response.strategy.angle,
              power: response.strategy.power,
            };
            
            // 🚶 NEW: 이동 정보 처리
            const moveDecision = response.move || { should_move: false, direction: 'stay', distance: 0 };
            
            // 🎯 NEW: 세 가지 멘트 저장
            if (response.taunts) {
              setTauntMessages(response.taunts);
              // before_shot 멘트 바로 표시
              if (response.taunts.before_shot) {
                setCurrentTaunt(response.taunts.before_shot);
                tauntOpacity.value = 0;
                tauntOpacity.value = withTiming(1, { duration: 300 });
              }
              console.log(`🤖 [LLM] Strategy: angle=${aiMove.angle}°, power=${aiMove.power}%`);
              console.log(`🤖 [LLM] Move:`, moveDecision);
              console.log(`🤖 [LLM] Taunts:`, response.taunts);
            } else if (response.taunt_message) {
              // Fallback: 기존 단일 멘트 (하위 호환)
              setCurrentTaunt(response.taunt_message);
              tauntOpacity.value = withTiming(1, { duration: 300 });
              console.log(`🤖 [LLM] Taunt: "${response.taunt_message}"`);
            }
            
            // 🚶 이동 실행 (LLM이 결정한 경우)
            if (moveDecision.should_move && moveDecision.direction !== 'stay') {
              const MAX_MOVE_RANGE = 80;
              const moveDistance = Math.min(Math.max(moveDecision.distance || 15, 5), 60); // 5-60px 제한
              const deltaX = moveDecision.direction === 'left' ? -moveDistance : moveDistance;
              const newX = currentAiTank.x + deltaX;
              const distanceFromInitial = Math.abs(newX - currentAiTank.initialX);
              
              // 범위 체크
              if (
                distanceFromInitial <= MAX_MOVE_RANGE &&
                newX >= scale(30) &&
                newX <= gameWidth - scale(30)
              ) {
                const newY = getTerrainY(newX, terrain.points) - 10;
                
                // ⭐ 새로운 탱크 객체 생성
                const movedAiTank = {
                  ...currentAiTank,
                  x: newX,
                  y: newY,
                };
                
                setAiTank(movedAiTank);
                HapticService.light();
                
                console.log(`🤖 [Move] LLM decided to move ${moveDecision.direction}: ${currentAiTank.x.toFixed(1)} → ${newX.toFixed(1)} (${moveDistance}px)`);
                
                // 🎯 이동 후 0.5초 대기 → 발사
                setTimeout(() => {
                  fireProjectile(movedAiTank, aiMove.angle, aiMove.power, 'ai');
                }, 500);
                return; // ⚠️ 여기서 종료 (이동 후 발사)
              } else {
                console.warn(`⚠️ [Move] LLM move blocked: out of range (${distanceFromInitial.toFixed(0)}px from initial)`);
              }
            }
          } else {
            throw new Error('LLM response invalid');
          }
        } catch (error) {
          console.error('❌ [LLM] Failed:', error);
          // Fallback to rule-based AI
          aiMove = calculateAIMove(currentAiTank, userTank, wind);
          console.log(`🤖 [AI] Fallback to rule-based: angle=${aiMove.angle.toFixed(1)}°, power=${aiMove.power.toFixed(1)}%`);
        } finally {
          setIsLoadingStrategy(false);
        }
      } else {
        // persona/user 정보 없음 → rule-based AI
        console.warn('⚠️ [AI] LLM skipped - Missing:', {
          persona_key: !persona?.persona_key,
          user_key: !user?.user_key,
        });
        aiMove = calculateAIMove(currentAiTank, userTank, wind);
        console.log(`🤖 [AI] Rule-based: angle=${aiMove.angle.toFixed(1)}°, power=${aiMove.power.toFixed(1)}%`);
      }
      
      // 1.5초 후 AI 발사
      setTimeout(() => {
        fireProjectile(currentAiTank, aiMove.angle, aiMove.power, 'ai');
      }, 1500);
    }
  }, [aiTank, userTank, terrain, wind, gameWidth, getTerrainY, calculateAIMove, fireProjectile, persona, user, shotsFired, shotsHit, lastUserShot, tauntOpacity]);

  /**
   * AI 각도/파워 계산 (Rule-based)
   */
  const calculateAIMove = useCallback((aiTank, userTank, wind) => {
    // 거리 계산
    const distance = Math.abs(userTank.x - aiTank.x);
    const heightDiff = userTank.y - aiTank.y; // 양수: user가 아래, 음수: user가 위
    
    console.log(`🤖 [AI] Distance: ${distance.toFixed(1)}px, Height diff: ${heightDiff.toFixed(1)}px`);
    
    // 기본 각도 (거리에 따라 조정)
    let baseAngle = 45;
    
    if (distance < 300) {
      baseAngle = 60; // 가까우면 높게
    } else if (distance > 600) {
      baseAngle = 35; // 멀면 낮게
    }
    
    // 높이 차이 보정
    if (heightDiff > 0) {
      baseAngle += 5; // user가 아래면 각도 증가
    } else if (heightDiff < -20) {
      baseAngle -= 5; // user가 위면 각도 감소
    }
    
    // 기본 파워 계산 (거리 기반)
    // 최대 거리 ≈ 1020px @ 100% power, 45도
    // R = v² / g ≈ power² (비례)
    const maxDistance = 1020;
    const powerRatio = Math.sqrt(distance / maxDistance);
    let basePower = Math.min(100, Math.max(50, powerRatio * 100));
    
    // 바람 보정 (AI는 좌측으로 발사)
    if (wind > 0) {
      // 우측 바람: AI가 좌측으로 발사하므로 역풍 → 파워 증가
      basePower += wind * 2;
    } else if (wind < 0) {
      // 좌측 바람: AI가 좌측으로 발사하므로 순풍 → 파워 감소
      basePower -= Math.abs(wind) * 2;
    }
    
    // 랜덤 오차 추가 (난이도: Easy)
    const angleError = (Math.random() * 10) - 5; // ±5도
    const powerError = (Math.random() * 10) - 5; // ±5%
    
    const finalAngle = Math.max(10, Math.min(80, baseAngle + angleError));
    const finalPower = Math.max(40, Math.min(100, basePower + powerError));
    
    return {
      angle: finalAngle,
      power: finalPower,
    };
  }, []);

  /**
   * 발사체 발사 (사용자/AI 공통)
   */
  const fireProjectile = useCallback((tank, angle, power, shooter) => {
    console.log(`🚀 [Fire] ${shooter.toUpperCase()} fires: angle=${angle.toFixed(1)}°, power=${power.toFixed(1)}%`);
    
    // ⭐ 통계: 발사 횟수 증가 (USER만)
    if (shooter === 'user') {
      setShotsFired(prev => prev + 1);
    }
    
    // ⭐ 방향 결정: user는 우측(→), ai는 좌측(←)
    const direction = shooter === 'user' ? 1 : -1;
    
    const trajectory = calculateTrajectory(
      tank.x,
      tank.y,
      angle,
      power,
      wind,
      direction
    );
    
    if (trajectory.length === 0) {
      console.error('❌ [Fire] Trajectory calculation failed');
      return;
    }
    
    // 애니메이션 시작
    setIsAnimating(true);
    setProjectile({ x: trajectory[0].x, y: trajectory[0].y });
    
    projectileX.value = trajectory[0].x;
    projectileY.value = trajectory[0].y;
    projectileOpacity.value = 0;
    projectileOpacity.value = withTiming(1, { duration: 100 });
    
    // 궤적 추적
    let currentIndex = 0;
    const animationInterval = setInterval(() => {
      currentIndex++;
      
      if (currentIndex >= trajectory.length) {
        // 궤적 종료 (빗나감)
        clearInterval(animationInterval);
        projectileOpacity.value = withTiming(0, { duration: 200 });
        
        setTimeout(() => {
          setProjectile(null);
          setIsAnimating(false);
          
          // 🎯 빗나감 처리
          if (shooter === 'user') {
            // 사용자 빗나감 기록
            const lastPoint = trajectory[trajectory.length - 1];
            const targetTank = aiTank;
            setLastUserShot({
              angle: angle,
              power: power,
              target_x: targetTank.x,
              target_y: targetTank.y,
              actual_hit_x: lastPoint.x,
              actual_hit_y: lastPoint.y,
              distance_error: Math.abs(lastPoint.x - targetTank.x),
              result: 'miss'
            });
          } else if (shooter === 'ai') {
            // AI 빗나감 → on_miss 멘트
            if (tauntMessages?.on_miss) {
              setCurrentTaunt(tauntMessages.on_miss);
              tauntOpacity.value = withTiming(1, { duration: 300 });
            }
          }
          
          // 턴 전환
          if (shooter === 'ai') {
            setTimeout(() => {
              setCurrentTurn('user');
              console.log('🔄 [Turn] Back to USER');
            }, 1000);
          }
        }, 200);
        return;
      }
      
      const point = trajectory[currentIndex];
      projectileX.value = point.x;
      projectileY.value = point.y;
      setProjectile({ x: point.x, y: point.y });
      
      // 충돌 감지
      const targetTank = shooter === 'user' ? aiTank : userTank;
      
      if (targetTank && checkTankCollision(point.x, point.y, targetTank)) {
        clearInterval(animationInterval);
        projectileOpacity.value = withTiming(0, { duration: 100 });
        
        console.log(`🎯 [Collision] ${shooter.toUpperCase()} hit ${shooter === 'user' ? 'AI' : 'USER'} tank!`);
        
        const damage = calculateDamage(0, true);
        console.log(`💥 [Damage] -${damage} HP`);
        
        if (shooter === 'user') {
          setAiTank(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
          // ⭐ 통계: 명중 + 데미지
          setShotsHit(prev => prev + 1);
          setTotalDamageDealt(prev => prev + damage);
          
          // 🎯 NEW: 사용자 사격 정보 기록 (LLM 학습용)
          setLastUserShot({
            angle: angle,
            power: power,
            target_x: targetTank.x,
            target_y: targetTank.y,
            actual_hit_x: point.x,
            actual_hit_y: point.y,
            distance_error: Math.abs(point.x - targetTank.x),
            result: 'hit'
          });
          
          // 🎭 NEW: 페르소나가 피해 입었을 때 멘트 (0.5초 딜레이)
          if (tauntMessages?.on_damaged) {
            setTimeout(() => {
              let damageLevel;
              if (damage >= 30) {
                damageLevel = 'heavy'; // 직격탄 (30 HP)
              } else if (damage >= 20) {
                damageLevel = 'medium'; // 20-25 HP
              } else {
                damageLevel = 'light'; // 10-15 HP
              }
              
              const damagedTaunt = tauntMessages.on_damaged[damageLevel];
              if (damagedTaunt) {
                setCurrentTaunt(damagedTaunt);
                tauntOpacity.value = withTiming(1, { duration: 300 });
                console.log(`💬 [Persona] Damaged (${damageLevel}): "${damagedTaunt}"`);
              }
            }, 500); // 0.5초 딜레이
          }
        } else {
          setUserTank(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
          
          // 🎯 AI 발사 결과 처리 (멘트 표시)
          if (tauntMessages?.on_hit) {
            setCurrentTaunt(tauntMessages.on_hit);
            tauntOpacity.value = withTiming(1, { duration: 300 });
          }
        }
        
        triggerExplosion(point.x, point.y, true);
        
        setTimeout(() => {
          setProjectile(null);
          setIsAnimating(false);
          
          const newHp = shooter === 'user' ? Math.max(0, aiTank.hp - damage) : Math.max(0, userTank.hp - damage);
          
          if (newHp <= 0) {
            console.log(`🎉 [Game] ${shooter.toUpperCase()} WINS!`);
            HapticService.success();
            setGameOver(true);
            setWinner(shooter);
          } else {
            // 턴 전환
            setTimeout(() => {
              if (shooter === 'user') {
                setCurrentTurn('ai');
                handleAITurn();
              } else {
                setCurrentTurn('user');
                console.log('🔄 [Turn] Back to USER');
              }
            }, 1500);
          }
        }, 100);
        return;
      }
      
      // 지형 충돌
      if (terrain && checkTerrainCollision(point.x, point.y, terrain)) {
        clearInterval(animationInterval);
        projectileOpacity.value = withTiming(0, { duration: 100 });
        
        console.log(`💥 [Collision] ${shooter.toUpperCase()} hit terrain`);
        
        // 스플래시 데미지
        const distance = Math.sqrt(
          Math.pow(point.x - targetTank.x, 2) + Math.pow(point.y - targetTank.y, 2)
        );
        
        const damage = calculateDamage(distance, false);
        
        if (damage > 0) {
          console.log(`💥 [Damage] Splash: -${damage} HP`);
          
          if (shooter === 'user') {
            setAiTank(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
            // ⭐ 통계: 스플래시 명중 + 데미지
            setShotsHit(prev => prev + 1);
            setTotalDamageDealt(prev => prev + damage);
            
            // 🎭 NEW: 페르소나가 피해 입었을 때 멘트 (0.5초 딜레이)
            if (tauntMessages?.on_damaged) {
              setTimeout(() => {
                let damageLevel;
                if (damage >= 20) {
                  damageLevel = 'medium'; // 20-25 HP (스플래시 최대)
                } else {
                  damageLevel = 'light'; // 10-15 HP (스플래시 최소)
                }
                
                const damagedTaunt = tauntMessages.on_damaged[damageLevel];
                if (damagedTaunt) {
                  setCurrentTaunt(damagedTaunt);
                  tauntOpacity.value = withTiming(1, { duration: 300 });
                  console.log(`💬 [Persona] Damaged (${damageLevel}, splash): "${damagedTaunt}"`);
                }
              }, 500); // 0.5초 딜레이
            }
          } else {
            setUserTank(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
          }
        }
        
        triggerExplosion(point.x, point.y, false);
        
        setTimeout(() => {
          setProjectile(null);
          setIsAnimating(false);
          
          const newHp = damage > 0 
            ? (shooter === 'user' ? Math.max(0, aiTank.hp - damage) : Math.max(0, userTank.hp - damage))
            : (shooter === 'user' ? aiTank.hp : userTank.hp);
          
          if (newHp <= 0) {
            console.log(`🎉 [Game] ${shooter.toUpperCase()} WINS!`);
            HapticService.success();
            setGameOver(true);
            setWinner(shooter);
          } else {
            // 턴 전환
            setTimeout(() => {
              if (shooter === 'user') {
                setCurrentTurn('ai');
                handleAITurn();
              } else {
                setCurrentTurn('user');
                console.log('🔄 [Turn] Back to USER');
              }
            }, 1500);
          }
        }, 100);
        return;
      }
    }, 20);
  }, [aiTank, userTank, terrain, wind, calculateTrajectory, checkTankCollision, checkTerrainCollision, calculateDamage, triggerExplosion, projectileX, projectileY, projectileOpacity, handleAITurn, tauntMessages, tauntOpacity]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Animated Styles
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 Animated Styles (순차적 바운스 애니메이션)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Terrain (Background)
  const terrainAnimatedStyle = useAnimatedStyle(() => ({
    opacity: terrainOpacity.value,
  }));
  
  // Left Avatar (USER)
  const leftAvatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: leftAvatarOpacity.value,
    transform: [{ translateX: leftAvatarTranslateX.value }],
  }));
  
  // Right Avatar (AI/Persona)
  const rightAvatarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightAvatarOpacity.value,
    transform: [{ translateX: rightAvatarTranslateX.value }],
  }));
  
  // Move Chip
  const moveChipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: moveChipOpacity.value,
    transform: [{ translateY: moveChipTranslateY.value }],
  }));
  
  // Angle Chip
  const angleChipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: angleChipOpacity.value,
    transform: [{ translateY: angleChipTranslateY.value }],
  }));
  
  // Power Chip
  const powerChipAnimatedStyle = useAnimatedStyle(() => ({
    opacity: powerChipOpacity.value,
    transform: [{ translateY: powerChipTranslateY.value }],
  }));
  
  // Fire Button
  const fireButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fireButtonOpacity.value,
    transform: [{ translateY: fireButtonTranslateY.value }],
  }));
  
  // Taunt Bubble
  const tauntBubbleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tauntBubbleOpacity.value,
    transform: [{ translateY: tauntBubbleTranslateY.value }],
  }));
  
  // 🎮 NEW: Start Modal
  const startModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: startModalOpacity.value,
    transform: [{ scale: startModalScale.value }],
  }));

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  if (!visible || !terrain) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 🎨 전체 컨테이너 - 배경 페이드 인 */}
      <Animated.View style={[styles.outerContainer, terrainAnimatedStyle]}>
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
              
              {/* ⭐ 턴 표시 (중앙) */}
              <View style={styles.turnIndicator}>
                {gameOver ? (
                  <CustomText style={[styles.turnText, styles.turnTextWinner]}>
                    {winner === 'user' ? '🎉 YOU WIN!' : '💀 AI WINS!'}
                  </CustomText>
                ) : (
                  <CustomText style={[
                    styles.turnText,
                    currentTurn === 'user' ? styles.turnTextUser : styles.turnTextAI
                  ]}>
                    {currentTurn === 'user' ? '🎯 YOUR TURN' : '🤖 AI TURN'}
                  </CustomText>
                )}
              </View>
              
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

                {/* ⭐ 폭발 효과 (Explosion) */}
                {explosion && (
                  <>
                    {/* 외부 원 (주황색) */}
                    <Circle
                      cx={explosion.x}
                      cy={explosion.y}
                      r={explosion.radius * 1.2}
                      fill="#FFA500"
                      opacity={explosion.opacity * 0.4}
                    />
                    {/* 중간 원 (핑크) */}
                    <Circle
                      cx={explosion.x}
                      cy={explosion.y}
                      r={explosion.radius}
                      fill="#FF6B9D"
                      opacity={explosion.opacity * 0.6}
                    />
                    {/* 내부 원 (흰색 중심) */}
                    <Circle
                      cx={explosion.x}
                      cy={explosion.y}
                      r={explosion.radius * 0.5}
                      fill="#FFFFFF"
                      opacity={explosion.opacity * 0.9}
                    />
                  </>
                )}
              </Svg>
            </View>

            {/* 🎨 상단: 아바타 오버레이 (좌우 개별 애니메이션) */}
            <View style={styles.avatarContainer}>
              {/* 좌측: 사용자 아바타 - 좌→우 슬라이드 */}
              <Animated.View style={[styles.avatarWrapper, leftAvatarAnimatedStyle]}>
                <View style={[styles.avatar, styles.userAvatar]}>
                  <CustomText style={styles.avatarEmoji}>👤</CustomText>
                </View>
                <View style={styles.hpBarContainer}>
                  <View style={[styles.hpBarFill, { width: `${userTank?.hp || 100}%`, backgroundColor: '#FF6B9D' }]} />
                </View>
                <CustomText style={styles.hpText}>{userTank?.hp || 100} HP</CustomText>
              </Animated.View>

              {/* 우측: 페르소나 아바타 - 우→좌 슬라이드 */}
              <Animated.View style={[styles.avatarWrapper, rightAvatarAnimatedStyle]}>
                <View style={[styles.avatar, styles.aiAvatar]}>
                  {/* ⭐ 페르소나 비디오/이미지 표시 */}
                  {persona?.selected_dress_video_url && persona?.selected_dress_video_convert_done === 'Y' ? (
                    // 비디오 (변환 완료된 경우)
                    Platform.OS === 'android' ? (
                      // Android: 추가 회전 컨테이너 필요
                      <View style={styles.androidMediaContainer}>
                        <Video
                          source={{ uri: persona.selected_dress_video_url }}
                          style={styles.avatarMedia}
                          resizeMode="cover"
                          repeat
                          muted
                          paused={false}
                        />
                      </View>
                    ) : (
                      // iOS: 직접 렌더링
                      <Video
                        source={{ uri: persona.selected_dress_video_url }}
                        style={styles.avatarMedia}
                        resizeMode="cover"
                        repeat
                        muted
                        paused={false}
                      />
                    )
                  ) : persona?.persona_image_url ? (
                    // 이미지 (비디오가 없거나 변환 미완료인 경우)
                    Platform.OS === 'android' ? (
                      // Android: 추가 회전 컨테이너 필요
                      <View style={styles.androidMediaContainer}>
                        <Image
                          source={{ uri: persona.persona_image_url }}
                          style={styles.avatarMedia}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      // iOS: 직접 렌더링
                      <Image
                        source={{ uri: persona.persona_image_url }}
                        style={styles.avatarMedia}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    // Fallback: 이모지 (persona 정보 없음)
                    <CustomText style={styles.avatarEmoji}>🤖</CustomText>
                  )}
                </View>
                <View style={styles.hpBarContainer}>
                  <View style={[styles.hpBarFill, { width: `${aiTank?.hp || 100}%`, backgroundColor: '#A78BFA' }]} />
                </View>
                <CustomText style={styles.hpText}>{aiTank?.hp || 100} HP</CustomText>
              </Animated.View>
            </View>
            
            {/* 🎨 페르소나 도발 메시지 (상단에서 통통 튀는 애니메이션) */}
            {currentTaunt && (
              <Animated.View 
                style={[
                  styles.tauntBubble,
                  tauntBubbleAnimatedStyle,
                  {
                    opacity: tauntOpacity,
                  }
                ]}
              >
                <CustomText style={styles.tauntText}>{currentTaunt}</CustomText>
                <View style={styles.tauntTriangle} />
              </Animated.View>
            )}

            {/* 🎨 하단 중앙: 컨트롤 칩셋 (순차 바운스 애니메이션) */}
            <View style={styles.controlChipsContainer}>
              {/* 이동 칩 (500ms) - 통통 */}
              <Animated.View style={[styles.moveChip, (!gameStarted || currentTurn !== 'user' || gameOver) && styles.controlChipDisabled, moveChipAnimatedStyle]}>
                <TouchableOpacity
                  style={styles.moveButton}
                  onPress={() => handleMove('left')}
                  disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                >
                  <Icon name="chevron-back" size={moderateScale(20)} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.moveButton}
                  onPress={() => handleMove('right')}
                  disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                >
                  <Icon name="chevron-forward" size={moderateScale(20)} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
              
              {/* 각도 칩 (600ms) - 통통 */}
              <Animated.View style={[styles.controlChip, (!gameStarted || currentTurn !== 'user' || gameOver) && styles.controlChipDisabled, angleChipAnimatedStyle, { marginLeft: scale(35) }]}>
                <MaterialIcon name="angle-acute" size={moderateScale(20)} color="#60A5FA" />
                <View style={styles.chipContent}>
                  <TouchableOpacity
                    style={styles.chipButton}
                    onPress={() => {
                      HapticService.light();
                      setAngle(Math.max(0, angle - 5));
                    }}
                    disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                  >
                    <Icon name="remove" size={moderateScale(16)} color="#FFF" />
                  </TouchableOpacity>
                  <CustomText style={styles.chipValue}>{angle}°</CustomText>
                  <TouchableOpacity
                    style={styles.chipButton}
                    onPress={() => {
                      HapticService.light();
                      setAngle(Math.min(90, angle + 5));
                    }}
                    disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                  >
                    <Icon name="add" size={moderateScale(16)} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* 🚀 발사 버튼 (700ms) - 중앙! 통통! */}
              <Animated.View style={fireButtonAnimatedStyle}>
                <TouchableOpacity 
                  style={[styles.fireChip, (!gameStarted || isAnimating || currentTurn !== 'user' || gameOver) && styles.fireChipDisabled]} 
                  onPress={handleFire}
                  disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                >
                  <Icon name="rocket" size={moderateScale(26)} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>

              {/* 파워 칩 (800ms) - 통통 */}
              <Animated.View style={[styles.controlChip, (!gameStarted || currentTurn !== 'user' || gameOver) && styles.controlChipDisabled, powerChipAnimatedStyle]}>
                <MaterialIcon name="flash" size={moderateScale(20)} color="#FFA500" />
                <View style={styles.chipContent}>
                  <TouchableOpacity
                    style={styles.chipButton}
                    onPress={() => {
                      HapticService.light();
                      setPower(Math.max(0, power - 5));
                    }}
                    disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                  >
                    <Icon name="remove" size={moderateScale(16)} color="#FFF" />
                  </TouchableOpacity>
                  <CustomText style={styles.chipValue}>{power}%</CustomText>
                  <TouchableOpacity
                    style={styles.chipButton}
                    onPress={() => {
                      HapticService.light();
                      setPower(Math.min(100, power + 5));
                    }}
                    disabled={!gameStarted || isAnimating || currentTurn !== 'user' || gameOver}
                  >
                    <Icon name="add" size={moderateScale(16)} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

            {/* 🎮 NEW: 게임 시작 확인 모달 */}
            {showStartModal && !gameStarted && (
              <Animated.View 
                style={[
                  styles.gameOverModal,
                  startModalAnimatedStyle,
                ]}
              >
                <View style={styles.gameOverContent}>
                  {/* 페르소나 이미지 */}
                  <View style={styles.startModalImageContainer}>
                    <Image
                      source={{ 
                        uri: persona?.selected_dress_image_url || persona?.persona_image_url || ''
                      }}
                      style={styles.startModalImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  {/* 페르소나 이름 */}
                  <CustomText style={[styles.gameStartTitle, { marginTop: verticalScale(15) }]}>
                    {persona?.persona_name || 'AI 페르소나'}
                  </CustomText>
                  
                  {/* 전적 (실제 데이터) */}
                  <CustomText style={[styles.statsText, { marginTop: verticalScale(0), fontSize: moderateScale(16) }]}>
                    {isLoadingStats ? (
                      '🏆 전적 불러오는 중...'
                    ) : gameStats ? (
                      `🏆 전적: ${gameStats.record_text} (승률 ${gameStats.win_rate}%)`
                    ) : (
                      '🏆 전적: 첫 대전!'
                    )}
                  </CustomText>
                  
                  {/* 버튼들 */}
                  <View style={styles.gameStartButtons}>
                    <TouchableOpacity 
                      style={[styles.gameOverButton, styles.playAgainButton]} 
                      onPress={handleStartGame}
                    >
                      <CustomText style={styles.gameOverButtonText}>🎮 시작하기</CustomText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.gameOverButton, styles.closeGameButton]} 
                      onPress={handleCancelStart}
                    >
                      <CustomText style={styles.gameOverButtonText}>❌ 취소</CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ⭐ 게임 오버 모달 */}
            {gameOver && (
              <Animated.View 
                style={[
                  styles.gameOverModal,
                  {
                    opacity: gameOverOpacity,
                    transform: [{ scale: gameOverScale }],
                  }
                ]}
              >
                <View style={styles.gameOverContent}>
                  {/* 제목 */}
                  <CustomText style={[
                    styles.gameOverTitle,
                    winner === 'user' ? styles.gameOverTitleWin : styles.gameOverTitleLose
                  ]}>
                    {winner === 'user' ? '🎉 VICTORY!' : '💀 DEFEATED'}
                  </CustomText>
                  
                  {/* 서브타이틀 */}
                  <CustomText style={styles.gameOverSubtitle}>
                    {winner === 'user' ? 'Perfect shot!' : 'Better luck next time!'}
                  </CustomText>
                  
                  {/* 구분선 */}
                  <View style={styles.gameOverDivider} />
                  
                  {/* 통계 제목 */}
                  <CustomText style={styles.statsTitle}>📊 Battle Statistics</CustomText>
                  
                  {/* 통계 항목들 */}
                  <View style={styles.statsContainer}>
                    {/* 명중률 */}
                    <View style={styles.statRow}>
                      <CustomText style={styles.statLabel}>🎯 Accuracy</CustomText>
                      <CustomText style={styles.statValue}>
                        {shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0}%
                      </CustomText>
                    </View>
                    
                    {/* 발사/명중 */}
                    <View style={styles.statRow}>
                      <CustomText style={styles.statLabel}>💥 Shots</CustomText>
                      <CustomText style={styles.statValue}>
                        {shotsHit} / {shotsFired}
                      </CustomText>
                    </View>
                    
                    {/* 총 데미지 */}
                    <View style={styles.statRow}>
                      <CustomText style={styles.statLabel}>⚡ Total Damage</CustomText>
                      <CustomText style={styles.statValue}>
                        {totalDamageDealt} HP
                      </CustomText>
                    </View>
                  </View>
                  
                  {/* 버튼들 */}
                  <View style={styles.gameOverButtons}>
                    <TouchableOpacity 
                      style={[styles.gameOverButton, styles.playAgainButton]}
                      onPress={handlePlayAgain}
                    >
                      <Icon name="refresh" size={moderateScale(24)} color="#FFF" />
                      <CustomText style={styles.buttonText}>Play Again</CustomText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.gameOverButton, styles.gameOverCloseButton]}
                      onPress={handleClose}
                    >
                      <Icon name="close" size={moderateScale(24)} color="#FFF" />
                      <CustomText style={styles.buttonText}>Close</CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}
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
  // ⭐ NEW: 턴 표시 UI
  turnIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },
  turnTextUser: {
    color: '#FF6B9D',
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
  },
  turnTextAI: {
    color: '#A78BFA',
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  turnTextWinner: {
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  windText: {
    fontSize: moderateScale(12), // ⭐ 크기 축소
    color: '#60A5FA',
    fontWeight: '600',
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
    top: verticalScale(60), // 헤더 아래
    left: scale(25),
    right: scale(25),
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
    overflow: 'hidden', // ⭐ 원형 마스크 강제 적용
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
    fontSize: moderateScale(19),
  },
  // ⭐ Android 전용: Video/Image를 감싸는 회전 컨테이너
  androidMediaContainer: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '90deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMedia: {
    width: '100%',
    height: '100%',
    borderRadius: scale(28), // 원형 마스크
    overflow: 'hidden',
    // ⭐ Android에서 90도 회전 후 비율 유지
    ...(Platform.OS === 'android' && {
      aspectRatio: 1, // 정사각형 유지
    }),
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
  
  // 🎮 NEW: AI Taunt Message Bubble (도발 메시지 말풍선)
  tauntBubble: {
    position: 'absolute',
    top: scale(70), // 아바타 아래
    right: 0,
    minWidth: scale(120),
    maxWidth: scale(200),
    backgroundColor: 'rgba(167, 139, 250, 0.95)', // 퍼플 (AI 색상)
    borderRadius: scale(12),
    padding: scale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
  tauntText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  tauntTriangle: {
    position: 'absolute',
    top: scale(-8),
    right: scale(20),
    width: 0,
    height: 0,
    borderLeftWidth: scale(8),
    borderRightWidth: scale(8),
    borderBottomWidth: scale(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(167, 139, 250, 0.95)',
  },
  
  // ⭐ NEW: Control Chips (하단 중앙 오버레이)
  controlChipsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: scale(15), // ⭐ 간격 최소화 (실제 디바이스 기준 Left)
    flexDirection: 'row', // ⭐ 가로 배치
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(12), // 칩 간격
  },
  controlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: moderateScale(24),
    height: scale(48), // ⭐ 고정 높이
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    gap: scale(6),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
  controlChipDisabled: {
    opacity: 0.4,
  },
  // ⭐ NEW: 이동 칩
  moveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: moderateScale(24),
    height: scale(48),
    paddingHorizontal: scale(8),
    gap: scale(2),
    borderWidth: 1.5,
    borderColor: 'rgba(76, 201, 240, 0.5)', // 청록색
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    ...Platform.select({
      android: { elevation: 5 },
    }),
    marginLeft: scale(-105),
    
  },
  moveButton: {
    padding: scale(6),
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
  // ⭐ 게임 오버 모달
  gameOverModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 어두운 배경
  },
  gameOverContent: {
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    borderRadius: moderateScale(24),
    padding: scale(30),
    width: scale(320),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    ...Platform.select({
      android: { elevation: 15 },
    }),
  },
  gameStartTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  gameOverTitle: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
  },
  gameOverTitleWin: {
    color: '#FFD700', // 골드
  },
  gameOverTitleLose: {
    color: '#888', // 그레이
  },
  gameOverSubtitle: {
    fontSize: moderateScale(14),
    color: '#AAA',
    marginBottom: verticalScale(20),
  },
  gameOverDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: verticalScale(20),
  },
  statsTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: verticalScale(15),
  },
  statsContainer: {
    width: '100%',
    gap: verticalScale(12),
    marginBottom: verticalScale(25),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(10),
  },
  statLabel: {
    fontSize: moderateScale(14),
    color: '#CCC',
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#FFF',
  },
  gameStartButtons: {
    marginTop: verticalScale(20),
    flexDirection: 'row',
    gap: scale(15),
    width: '100%',
  },
  gameOverButtons: {
    flexDirection: 'row',
    gap: scale(15),
    width: '100%',
  },
  gameOverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    ...Platform.select({
      android: { elevation: 5 },
    }),
  },
  playAgainButton: {
    backgroundColor: '#4CAF50', // 그린
  },
  gameOverCloseButton: {
    backgroundColor: '#FF6B9D', // ANIMA 핑크
  },
  buttonText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#FFF',
  },
  // 🎮 NEW: 게임 시작 모달 - 페르소나 이미지
  startModalImageContainer: {
    width: scale(130),
    height: scale(130),
    borderRadius: scale(75),
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#A78BFA', // 페르소나 퍼플
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  startModalImage: {
    width: '100%',
    height: '100%',
  },
  // 🎮 NEW: 취소 버튼 (시작 모달용)
  closeGameButton: {
    backgroundColor: '#888', // 그레이
  },
});

export default FortressGameView;
