import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  UserX, 
  UserCheck,
  Shield,
  Loader2,
  AlertTriangle,
  Crown,
  ShieldPlus,
  ShieldMinus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAccountManagement, UTILITY_KEYS } from '@/hooks/admin/useAccountManagement';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AccountManagement: React.FC = () => {
  const { t } = useLanguage();
  const { isOwner } = useUserRole();
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    toggleUserStatus, 
    toggleUtilityPermission,
    getUtilityEnabled,
    toggleAllUtilities,
    areAllUtilitiesEnabled,
    assignAdminRole,
    removeAdminRole
  } = useAccountManagement();
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');

  // Filtered users
  const filteredUsers = users.filter(user => {
    // Role filter
    if (roleFilter === 'admin' && user.role !== 'admin' && user.role !== 'owner') return false;
    if (roleFilter === 'user' && (user.role === 'admin' || user.role === 'owner')) return false;
    
    // Status filter
    if (statusFilter === 'active' && !user.is_active) return false;
    if (statusFilter === 'deactivated' && user.is_active) return false;
    
    return true;
  });

  const toggleExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleStatusToggle = async (userId: string, activate: boolean) => {
    setProcessingUsers(prev => new Set(prev).add(userId));
    try {
      await toggleUserStatus(userId, activate);
      toast.success(activate 
        ? t('User account reactivated', '用户账户已重新激活')
        : t('User account deactivated', '用户账户已停用')
      );
    } catch (err: any) {
      toast.error(err.message || t('Failed to update user status', '更新用户状态失败'));
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUtilityToggle = async (userId: string, utilityKey: string, enabled: boolean) => {
    try {
      await toggleUtilityPermission(userId, utilityKey, enabled);
      toast.success(enabled 
        ? t('Utility enabled for user', '已为用户启用此功能')
        : t('Utility disabled for user', '已为用户禁用此功能')
      );
    } catch (err: any) {
      toast.error(err.message || t('Failed to update utility permission', '更新功能权限失败'));
    }
  };

  const handleToggleAll = async (userId: string, enabled: boolean) => {
    try {
      await toggleAllUtilities(userId, enabled);
      toast.success(enabled 
        ? t('All utilities enabled', '已启用所有功能')
        : t('All utilities disabled', '已禁用所有功能')
      );
    } catch (err: any) {
      toast.error(err.message || t('Failed to toggle all utilities', '切换所有功能失败'));
    }
  };

  const handleAssignAdmin = async (userId: string) => {
    try {
      await assignAdminRole(userId);
      toast.success(t('Admin role assigned', '已授予管理员权限'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to assign admin role', '授予管理员权限失败'));
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeAdminRole(userId);
      toast.success(t('Admin role removed', '已移除管理员权限'));
    } catch (err: any) {
      toast.error(err.message || t('Failed to remove admin role', '移除管理员权限失败'));
    }
  };

  if (loading) {
    return (
      <Card className="bg-cosmic-900/50 border-cosmic-700/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cosmic-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-cosmic-900/50 border-cosmic-700/30">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-cosmic-300">{error}</p>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('Retry', '重试')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-cosmic-50">
                {t('Account Management', '账户管理')}
              </CardTitle>
              <CardDescription className="text-cosmic-400">
                {t('Manage user accounts and utility permissions', '管理用户账户和功能权限')}
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="sm"
            className="border-cosmic-600 hover:bg-cosmic-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('Refresh', '刷新')}
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-cosmic-400">{t('Role:', '角色:')}</span>
            <div className="flex gap-1">
              <Button
                variant={roleFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className={roleFilter === 'all' ? 'bg-cosmic-600' : 'border-cosmic-600'}
                onClick={() => setRoleFilter('all')}
              >
                {t('All', '全部')}
              </Button>
              <Button
                variant={roleFilter === 'admin' ? 'default' : 'outline'}
                size="sm"
                className={roleFilter === 'admin' ? 'bg-purple-600' : 'border-purple-500/30 text-purple-400'}
                onClick={() => setRoleFilter('admin')}
              >
                <Shield className="h-3 w-3 mr-1" />
                {t('Admins', '管理员')}
              </Button>
              <Button
                variant={roleFilter === 'user' ? 'default' : 'outline'}
                size="sm"
                className={roleFilter === 'user' ? 'bg-cosmic-600' : 'border-cosmic-600'}
                onClick={() => setRoleFilter('user')}
              >
                {t('Users', '用户')}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-cosmic-400">{t('Status:', '状态:')}</span>
            <div className="flex gap-1">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === 'all' ? 'bg-cosmic-600' : 'border-cosmic-600'}
                onClick={() => setStatusFilter('all')}
              >
                {t('All', '全部')}
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === 'active' ? 'bg-green-600' : 'border-green-500/30 text-green-400'}
                onClick={() => setStatusFilter('active')}
              >
                <UserCheck className="h-3 w-3 mr-1" />
                {t('Active', '活跃')}
              </Button>
              <Button
                variant={statusFilter === 'deactivated' ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === 'deactivated' ? 'bg-red-600' : 'border-red-500/30 text-red-400'}
                onClick={() => setStatusFilter('deactivated')}
              >
                <UserX className="h-3 w-3 mr-1" />
                {t('Deactivated', '已停用')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-xs text-cosmic-400 mt-2">
          {t(`Showing ${filteredUsers.length} of ${users.length} users`, `显示 ${filteredUsers.length} / ${users.length} 用户`)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-cosmic-400">
            {users.length === 0 
              ? t('No users to manage', '没有可管理的用户')
              : t('No users match the current filters', '没有符合当前筛选条件的用户')
            }
          </div>
        ) : (
          filteredUsers.map(user => {
            const isExpanded = expandedUsers.has(user.user_id);
            const isProcessing = processingUsers.has(user.user_id);

            return (
              <Collapsible
                key={user.user_id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(user.user_id)}
              >
                <Card className={`border transition-colors ${
                  user.is_active 
                    ? 'bg-cosmic-800/30 border-cosmic-700/30' 
                    : 'bg-red-950/20 border-red-500/30'
                }`}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-cosmic-700/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-cosmic-700 text-cosmic-200">
                              {(user.username || user.email)?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-cosmic-100">
                                {user.username || t('No username', '无用户名')}
                              </span>
                              {user.role === 'owner' && (
                                <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {t('Owner', '所有者')}
                                </Badge>
                              )}
                              {user.role === 'admin' && (
                                <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  <Shield className="h-3 w-3 mr-1" />
                                  {t('Admin', '管理员')}
                                </Badge>
                              )}
                              <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-xs">
                                {user.is_active ? t('Active', '活跃') : t('Deactivated', '已停用')}
                              </Badge>
                            </div>
                            <span className="text-sm text-cosmic-400">{user.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {/* Admin role management - only for owner and not for owner users */}
                            {isOwner && user.role !== 'owner' && (
                              user.role === 'admin' ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                                    >
                                      <ShieldMinus className="h-4 w-4 mr-1" />
                                      {t('Remove Admin', '移除管理员')}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-cosmic-900 border-cosmic-700">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-cosmic-50">
                                        {t('Remove Admin Role', '移除管理员权限')}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-cosmic-300">
                                        {t(
                                          'This will remove admin privileges from this user. Are you sure?',
                                          '这将移除该用户的管理员权限。确定吗？'
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-cosmic-800 border-cosmic-600 text-cosmic-100">
                                        {t('Cancel', '取消')}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveAdmin(user.user_id)}
                                        className="bg-purple-600 hover:bg-purple-700"
                                      >
                                        {t('Remove Admin', '移除管理员')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                                  onClick={() => handleAssignAdmin(user.user_id)}
                                >
                                  <ShieldPlus className="h-4 w-4 mr-1" />
                                  {t('Make Admin', '设为管理员')}
                                </Button>
                              )
                            )}
                            {user.is_active ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserX className="h-4 w-4 mr-1" />
                                    )}
                                    {t('Deactivate', '停用')}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-cosmic-900 border-cosmic-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-cosmic-50">
                                      {t('Deactivate User', '停用用户')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-cosmic-300">
                                      {t(
                                        'This will prevent the user from accessing the platform. Are you sure?',
                                        '这将阻止该用户访问平台。确定吗？'
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-cosmic-800 border-cosmic-600 text-cosmic-100">
                                      {t('Cancel', '取消')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleStatusToggle(user.user_id, false)}
                                      className="bg-amber-600 hover:bg-amber-700"
                                    >
                                      {t('Deactivate', '停用')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                                disabled={isProcessing}
                                onClick={() => handleStatusToggle(user.user_id, true)}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4 mr-1" />
                                )}
                                {t('Reactivate', '重新激活')}
                              </Button>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-cosmic-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-cosmic-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t border-cosmic-700/30 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-cosmic-400" />
                          <span className="text-sm font-medium text-cosmic-200">
                            {t('Utility Permissions', '功能权限')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-cosmic-400">
                            {t('Toggle All', '全部切换')}
                          </span>
                          <Switch
                            checked={areAllUtilitiesEnabled(user.user_id)}
                            onCheckedChange={(checked) => handleToggleAll(user.user_id, checked)}
                            disabled={!user.is_active}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {UTILITY_KEYS.map(utility => {
                          const isEnabled = getUtilityEnabled(user.user_id, utility.key);
                          return (
                            <div 
                              key={utility.key}
                              className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/30 border border-cosmic-700/20"
                            >
                              <span className="text-sm text-cosmic-200">
                                {t(utility.label, utility.labelZh)}
                              </span>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => 
                                  handleUtilityToggle(user.user_id, utility.key, checked)
                                }
                                disabled={!user.is_active}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default AccountManagement;
