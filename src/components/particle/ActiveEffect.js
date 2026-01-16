/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ✨ ActiveEffect - Layer 2 (Dynamic Active Effects)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Dynamic, engaging effects that draw attention
 * - Higher z-index (above background effects)
 * - Active animations that enhance message emotion
 * 
 * Effects:
 * - none: No effect
 * 
 * 💕 Love & Romance:
 * - hearts: Falling hearts 💕
 * - neon_hearts: Neon hearts 💖 (uses Hearts component)
 * 
 * 🎉 Celebration & Joy:
 * - confetti: Colorful confetti 🎉
 * - sparkles: Sparkles ✨
 * - fireworks: Fireworks 🎆 (bottom-up burst)
 * 
 * 🌿 Nature & Season:
 * - snow: Snowflakes ❄️
 * - rain_soft: Soft rain 🌧️
 * - sakura: Cherry blossoms 🌸 (uses Snow component with pink tint)
 * - leaves: Falling leaves 🍂 (uses Snow component with orange tint)
 * 
 * 🕯️ Comfort & Hope:
 * - comfort_light: Warm light 🕯️
 * - hope_star: Rising stars ⭐
 * - fireflies: Fireflies ✨ (uses Sparkles component with soft glow)
 * 
 * 💬 Custom Words:
 * - floating_words: User's custom words floating upward
 * - scrolling_words: User's custom words scrolling left to right
 * 
 * 2-Layer System Architecture:
 * - This is Layer 2 (z-index: 50)
 * - Works with Layer 1 (BackgroundEffect, z-index: 10)
 * - Can be combined for rich emotional expressions
 * 
 * @author JK & Hero Nexus AI
 * @date 2024-12-10 (2-Layer System)
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import LottieView from 'lottie-react-native'; // ⭐ NEW: Lottie animations
import Confetti from './Confetti';
import Fireworks from './Fireworks'; // ⭐ NEW: Dynamic fireworks
import Hearts from './Hearts';
import Snow from './Snow';
import Sparkles from './Sparkles';
import ComfortLight from './ComfortLight';
import HopeStar from './HopeStar';
import RainSoft from './RainSoft';
import FloatingWords from './FloatingWords'; // ⭐ NEW: Custom words floating up
import ScrollingWords from './ScrollingWords'; // ⭐ NEW: Custom words scrolling
import FadingMessages from './FadingMessages'; // ⭐ NEW: Sequential fading messages
import TVNoise from './TVNoise'; // ⭐ NEW: Analog TV static effect
import { verticalScale } from '../../utils/responsive-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ⭐ NEW: CheersToastEffect Component (Plays twice, then triggers beer bottles)
const CheersToastEffect = ({ onComplete }) => {
  const lottieRef = useRef(null);
  const [playCount, setPlayCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    console.log('🍻 [CheersToastEffect] Mounted, play count:', playCount);
    if (playCount === 0) {
      lottieRef.current?.play();
      console.log('🍻 [CheersToastEffect] Starting first play');
    }
  }, []);
  
  const handleAnimationFinish = () => {
    console.log('🍻 [CheersToastEffect] Animation finished, play count:', playCount);
    
    if (playCount === 0) {
      // First play finished, play again!
      console.log('🍻 [CheersToastEffect] Playing second time (건배! 건배!)');
      setPlayCount(1);
      setTimeout(() => {
        lottieRef.current?.play();
      }, 100);
    } else {
      // Second play finished, hide & trigger beer bottles!
      console.log('🍻 [CheersToastEffect] Completed 2x plays! Hiding & triggering beer bottles... 🎉');
      setTimeout(() => {
        setIsVisible(false);
        console.log('🍻 [CheersToastEffect] Component hidden, triggering callback');
        // ⭐ NEW: Trigger beer bottles particle effect
        if (onComplete) {
          console.log('🍺 [CheersToastEffect] Calling onComplete callback!');
          onComplete();
        }
      }, 500);
    }
  };
  
  if (!isVisible) {
    console.log('🍻 [CheersToastEffect] Component is hidden (no render)');
    return null;
  }
  
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      <LottieView
        ref={lottieRef}
        source={require('../../assets/animations/cheers-toast.json')}
        loop={false}
        style={{
          width: SCREEN_WIDTH * 0.8,
          height: SCREEN_HEIGHT * 0.6,
        }}
        onAnimationFinish={handleAnimationFinish}
      />
    </View>
  );
};

const ActiveEffect = ({ type = 'none', isActive = true, customWords = [] }) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ [ActiveEffect] Rendering (Layer 2)');
  console.log('  - type:', type);
  console.log('  - isActive:', isActive);
  console.log('  - customWords:', customWords);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const insets = useSafeAreaInsets();
  
  // ⭐ NEW: State for beer bottles particle (triggered after cheers)
  const [showBeerBottles, setShowBeerBottles] = useState(false);
  
  // ⭐ NEW: Callback when cheers animation completes
  const handleCheersComplete = useCallback(() => {
    console.log('🍺 [ActiveEffect] Cheers complete! Starting beer bottles...');
    setShowBeerBottles(true);
  }, []);
  
  // No effect
  if (type === 'none' || !isActive) {
    console.log('🌙 [ParticleEffect] No effect or inactive');
    return null;
  }

  // Render appropriate particle effect
  const renderParticleEffect = () => {
    switch (type) {
      // ─────────────────────────────────────────────────────────────────────
      // 💕 Love & Romance
      // ─────────────────────────────────────────────────────────────────────
      case 'hearts':
        return <Hearts key="hearts" variant="normal" />;
      case 'neon_hearts':
        // ⭐ New: Use Hearts component with neon styling
        return <Hearts key="neon_hearts" variant="neon" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🎉 Celebration & Joy
      // ─────────────────────────────────────────────────────────────────────
      case 'confetti':
        return <Confetti key="confetti" />;
      case 'sparkles':
        return <Sparkles key="sparkles" variant="sparkles" />;
      case 'fireworks':
        // ⭐ NEW: Use Fireworks component for "파파팡" dynamic explosions
        console.log('🎆 [ParticleEffect] Using Fireworks component (react-native-confetti-cannon)');
        return <Fireworks key="fireworks" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🌿 Nature & Season
      // ─────────────────────────────────────────────────────────────────────
      case 'snow':
        return <Snow key="snow" variant="snow" />;
      case 'rain_soft':
        return <RainSoft key="rain_soft" />;
      case 'sakura':
        // ⭐ New: Use Snow component for cherry blossom petals
        return <Snow key="sakura" variant="sakura" />;
      case 'leaves':
        // ⭐ New: Use Snow component for falling leaves
        return <Snow key="leaves" variant="leaves" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🕯️ Comfort & Hope
      // ─────────────────────────────────────────────────────────────────────
      case 'comfort_light':
        return <ComfortLight key="comfort_light" />;
      case 'hope_star':
        return <HopeStar key="hope_star" />;
      case 'fireflies':
        // ⭐ New: Use Sparkles component for fireflies effect
        return <Sparkles key="fireflies" variant="fireflies" />;
      
      case 'stars_floating':
        // 🎨 NEW: Floating stars for emotional gifts (crisis comfort)
        // Use Sparkles with fireflies variant for gentle floating stars
        console.log('🌟 [ActiveEffect] Stars floating (gift effect)');
        return <Sparkles key="stars_floating" variant="fireflies" />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 💬 Custom Words (Personal)
      // ─────────────────────────────────────────────────────────────────────
      case 'floating_words':
        // ⭐ NEW: User's custom words floating up
        console.log('💬 [ParticleEffect] Using FloatingWords with:', customWords);
        return <FloatingWords key="floating_words" words={customWords.length > 0 ? customWords : ['사랑해', '고마워']} />;
      
      case 'scrolling_words':
        // ⭐ NEW: User's custom words scrolling left to right
        console.log('💬➡️ [ParticleEffect] Using ScrollingWords with:', customWords);
        return <ScrollingWords key="scrolling_words" words={customWords.length > 0 ? customWords : ['사랑해', '고마워']} />;
      
      case 'fading_messages':
        // ⭐ NEW: Sequential fading messages (cinematic storytelling)
        console.log('💬✨ [ParticleEffect] Using FadingMessages with:', customWords);
        return <FadingMessages key="fading_messages" words={customWords.length > 0 ? customWords : ['올 한해도 저물어 가네요', '나의 히어로님과 함께해서', '이겨낼 수 있었고', '함께해서 영광이였습니다']} />;
      
      // ─────────────────────────────────────────────────────────────────────
      // 🍻 Food & Drink (Lottie Animations + Particle Combo)
      // ─────────────────────────────────────────────────────────────────────
      case 'cheers_toast':
        // ⭐ NEW: Cheers toast animation (Lottie) - Play twice, then beer bottles!
        console.log('🍻 [ActiveEffect] Cheers Toast (Lottie) - 2x repeat → Beer Bottles');
        return (
          <>
            <CheersToastEffect key="cheers_toast" onComplete={handleCheersComplete} />
            {showBeerBottles && <Snow key="beer_bottles" variant="beer_bottles" />}
          </>
        );
      
      // ─────────────────────────────────────────────────────────────────────
      // 📺 Retro (Vintage)
      // ─────────────────────────────────────────────────────────────────────
      case 'tv_noise_weak':
        // ⭐ NEW: Analog TV noise (weak)
        console.log('📺 [ActiveEffect] TV Noise (Weak)');
        return <TVNoise key="tv_noise_weak" variant="weak" />;
      
      case 'tv_noise_medium':
        // ⭐ NEW: Analog TV noise (medium) - RECOMMENDED
        console.log('📺 [ActiveEffect] TV Noise (Medium)');
        return <TVNoise key="tv_noise_medium" variant="medium" />;
      
      case 'tv_noise_strong':
        // ⭐ NEW: Analog TV noise (strong)
        console.log('📺 [ActiveEffect] TV Noise (Strong)');
        return <TVNoise key="tv_noise_strong" variant="strong" />;
      
      default:
        console.warn(`[ParticleEffect] Unknown particle type: ${type}`);
        return null;
    }
  };

  return (
    <View style={[styles.container, {  }]} pointerEvents="none">
      {renderParticleEffect()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,

    zIndex: 50, // ⭐ Layer 2: Above BackgroundEffect (z-index: 10), below content
  },
});

// ⭐ Memoize to prevent unnecessary re-renders
export default React.memo(ActiveEffect, (prevProps, nextProps) => {
  // Only re-render if type, isActive, or customWords changes
  return (
    prevProps.type === nextProps.type && 
    prevProps.isActive === nextProps.isActive &&
    JSON.stringify(prevProps.customWords) === JSON.stringify(nextProps.customWords) // ⭐ CRITICAL FIX
  );
});

