import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@constants';
import { useAdmin, useAuth } from '@hooks';
import { Card } from '@components/Card';
import { Skeleton } from '@components/Skeleton';
import { UserAccount, LoginEvent, UserPerformance } from '@types';

interface AdminDashboardProps {
  onNavigateToUserDetail: (userId: string) => void;
  onNavigateToLoginLogs: () => void;
}

export default function AdminDashboardScreen({ 
  onNavigateToUserDetail, 
  onNavigateToLoginLogs 
}: AdminDashboardProps) {
  const { users, loginEvents, loading, refresh, suspendUser, activateUser, deleteUser } = useAdmin();
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    newUsersToday: users.filter(u => {
      const today = new Date().toISOString().split('T')[0];
      return u.joinDate.startsWith(today);
    }).length,
    totalLoginsToday: loginEvents.filter(e => {
      const today = new Date().toISOString().split('T')[0];
      return e.timestamp.startsWith(today) && e.type === 'login';
    }).length,
    failedLoginsToday: loginEvents.filter(e => {
      const today = new Date().toISOString().split('T')[0];
      return e.timestamp.startsWith(today) && e.type === 'failed_login';
    }).length,
  };

  const renderUserCard = ({ item }: { item: UserAccount }) => (
    <TouchableOpacity onPress={() => onNavigateToUserDetail(item.id)}>
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={[styles.statusBadge, 
            item.status === 'active' ? styles.statusActive : 
            item.status === 'suspended' ? styles.statusSuspended : styles.statusInactive
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.userStats}>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>{item.weeklyTarget}</Text>
            <Text style={styles.userStatLabel}>days/week</Text>
          </View>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>
              {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}
            </Text>
            <Text style={styles.userStatLabel}>last login</Text>
          </View>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>
              {new Date(item.joinDate).toLocaleDateString()}
            </Text>
            <Text style={styles.userStatLabel}>joined</Text>
          </View>
        </View>

        <View style={styles.userActions}>
          {item.status === 'active' ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.suspendButton]} 
              onPress={() => suspendUser(item.id)}
            >
              <Ionicons name="ban" size={14} color={COLORS.warning} />
              <Text style={styles.suspendText}>Suspend</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.activateButton]} 
              onPress={() => activateUser(item.id)}
            >
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.activateText}>Activate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => deleteUser(item.id)}
          >
            <Ionicons name="trash" size={14} color={COLORS.error} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderLoginEvent = ({ item }: { item: LoginEvent }) => (
    <Card style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.logIcon}>
          <Ionicons 
            name={
              item.type === 'login' ? 'log-in' : 
              item.type === 'signup' ? 'person-add' : 
              item.type === 'logout' ? 'log-out' : 'alert-circle'
            } 
            size={18} 
            color={
              item.type === 'login' ? COLORS.success : 
              item.type === 'signup' ? COLORS.primary : 
              item.type === 'logout' ? COLORS.textSecondary : COLORS.error
            } 
          />
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.logUser}>{item.userName}</Text>
          <Text style={styles.logEmail}>{item.userEmail}</Text>
        </View>
        <View style={[styles.logTypeBadge, 
          item.type === 'login' ? styles.typeLogin :
          item.type === 'signup' ? styles.typeSignup :
          item.type === 'logout' ? styles.typeLogout : styles.typeFailed
        ]}>
          <Text style={styles.logTypeText}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.logTime}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <View style={styles.adminBadge}>
          <Ionicons name="shield" size={20} color={COLORS.admin} />
          <Text style={styles.adminTitle}>Admin Panel</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.admin} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardSuccess]}>
            <Ionicons name="person" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardWarning]}>
            <Ionicons name="person-add" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.newUsersToday}</Text>
            <Text style={styles.statLabel}>New Today</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardAdmin]}>
            <Ionicons name="log-in" size={24} color={COLORS.admin} />
            <Text style={styles.statValue}>{stats.totalLoginsToday}</Text>
            <Text style={styles.statLabel}>Logins Today</Text>
          </Card>
        </View>

        {/* Failed Logins Alert */}
        {stats.failedLoginsToday > 0 && (
          <Card style={styles.alertCard}>
            <Ionicons name="warning" size={20} color={COLORS.error} />
            <Text style={styles.alertText}>
              {stats.failedLoginsToday} failed login attempts today
            </Text>
          </Card>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons 
              name="people" 
              size={16} 
              color={activeTab === 'users' ? COLORS.admin : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Users ({users.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
            onPress={() => setActiveTab('logs')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={activeTab === 'logs' ? COLORS.admin : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
              Login Logs ({loginEvents.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} width="100%" height={120} style={styles.skeletonItem} />
            ))}
          </View>
        ) : activeTab === 'users' ? (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserCard}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No users registered yet</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={loginEvents.slice(0, 50)}
            keyExtractor={(item) => item.id}
            renderItem={renderLoginEvent}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="list" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No login events recorded</Text>
              </View>
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.admin,
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: 14,
  },
  statCardPrimary: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  statCardSuccess: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  statCardWarning: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  statCardAdmin: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.admin,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: COLORS.error,
    marginBottom: 16,
  },
  alertText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.admin,
  },
  skeletonContainer: {
    gap: 12,
  },
  skeletonItem: {
    marginBottom: 12,
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusSuspended: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  statusInactive: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    marginBottom: 12,
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  userStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  suspendButton: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  suspendText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  activateButton: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  activateText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  deleteText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  logCard: {
    marginBottom: 8,
    padding: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logInfo: {
    flex: 1,
  },
  logUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  logEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeLogin: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  typeSignup: {
    backgroundColor: 'rgba(79, 142, 247, 0.15)',
  },
  typeLogout: {
    backgroundColor: 'rgba(176, 176, 176, 0.15)',
  },
  typeFailed: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  logTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
