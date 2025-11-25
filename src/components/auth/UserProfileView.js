/**
 * 👤 UserProfileView - Logged-in User Profile
 * 
 * Features:
 * - User info display
 * - Logout button
 * - Profile image
 * - User stats (points, etc.)
 * 
 * Props:
 * - user: Object (from UserContext)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale, moderateScale } from '../../utils/responsive-utils';
import { COLORS } from '../../styles/commonstyles';
import { useUser } from '../../contexts/UserContext';
import AuthCard from './AuthCard';
import CustomButton from '../CustomButton';

const UserProfileView = ({ user }) => {
  const { logout } = useUser();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // ✅ Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      console.log('✅ [UserProfileView] Logout success');
    } catch (error) {
      console.error('❌ [UserProfileView] Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuthCard style={styles.card}>
        {/* ✅ Profile header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user.user_profile_image ? (
              <Image
                source={{ uri: user.user_profile_image }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon
                  name="account"
                  size={moderateScale(40)}
                  color={COLORS.DEEP_BLUE}
                />
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.user_name || user.user_id}
            </Text>
            <Text style={styles.userEmail}>{user.user_email}</Text>
          </View>
        </View>

        {/* ✅ User stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon
              name="star"
              size={moderateScale(24)}
              color={COLORS.DEEP_BLUE}
            />
            <Text style={styles.statValue}>{user.user_point || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Icon
              name="account-group"
              size={moderateScale(24)}
              color={COLORS.DEEP_BLUE}
            />
            <Text style={styles.statValue}>
              {user.persona_key ? '1' : '0'}
            </Text>
            <Text style={styles.statLabel}>Personas</Text>
          </View>
        </View>

        {/* ✅ Account info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Icon
              name="shield-check"
              size={moderateScale(20)}
              color="#10B981"
            />
            <Text style={styles.infoText}>Account Verified</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon
              name="calendar"
              size={moderateScale(20)}
              color="#6B7280"
            />
            <Text style={styles.infoText}>
              Joined {new Date(user.created_date).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* ✅ Logout button */}
        <CustomButton
          title="Logout"
          onPress={handleLogout}
          loading={isLoggingOut}
          disabled={isLoggingOut}
          variant="outline"
          style={styles.logoutButton}
        />
      </AuthCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  avatarContainer: {
    marginRight: scale(16),
  },
  avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: scale(4),
  },
  userEmail: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: scale(20),
    marginBottom: scale(24),
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: scale(16),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.DEEP_BLUE,
    marginTop: scale(8),
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginTop: scale(4),
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  infoContainer: {
    marginBottom: scale(24),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginLeft: scale(12),
  },
  logoutButton: {
    marginTop: scale(8),
  },
});

export default UserProfileView;

