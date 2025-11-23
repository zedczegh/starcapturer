import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell, CheckCircle, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import VerificationApplicationCard from './VerificationApplicationCard';

interface AdminNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
  related_spot_id?: string;
  related_application_id?: string;
  metadata?: any;
}

interface VerificationApplication {
  id: string;
  spot_id: string;
  applicant_id: string;
  status: string;
  bortle_level?: number;
  created_at: string;
  bortle_measurement_url?: string;
  facility_images_urls?: string[];
  accommodation_description?: string;
  additional_notes?: string;
  admin_notes?: string;
  user_astro_spots: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
  };
  profiles: {
    username?: string;
    avatar_url?: string;
  };
}

const AdminNotifications: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchVerificationApplications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const fetchVerificationApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('astro_spot_verification_applications')
        .select(`
          *,
          user_astro_spots!inner(name, description, latitude, longitude)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately since there's no direct relation
      const applicationsWithProfiles = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profile } = await supabase
            .rpc('get_public_profile', { p_user_id: app.applicant_id });

          const profileData = profile?.[0];
          return {
            ...app,
            profiles: profileData || { username: null, avatar_url: null }
          };
        })
      );

      setApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error fetching verification applications:', error);
      toast.error('Failed to load verification applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const pendingApplicationsCount = applications.filter(app => app.status === 'pending').length;

  if (loading && applicationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('Admin Panel', '管理员面板')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            {t('Loading...', '加载中...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("Admin Panel", "管理员面板")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="applications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="truncate">{t("Verification", "验证")}</span>
              {pendingApplicationsCount > 0 && (
                <Badge variant="destructive" className="ml-0.5 sm:ml-1 text-xs px-1 sm:px-1.5">
                  {pendingApplicationsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="truncate">{t("Notifications", "通知")}</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-0.5 sm:ml-1 text-xs px-1 sm:px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-4 sm:mt-6">
            {applicationsLoading ? (
              <div className="text-center py-4 text-xs sm:text-sm">
                {t("Loading applications...", "加载申请中...")}
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                {t("No verification applications yet", "暂无验证申请")}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {applications.map((application) => (
                  <VerificationApplicationCard
                    key={application.id}
                    application={application}
                    onStatusUpdate={fetchVerificationApplications}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 sm:mt-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs h-8"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  {t("Mark All Read", "全部已读")}
                </Button>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                {t("No notifications yet", "暂无通知")}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      notification.is_read
                        ? "border-border bg-background"
                        : "border-primary/20 bg-primary/5"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-xs sm:text-sm truncate ${
                            notification.is_read ? "text-muted-foreground" : "text-foreground"
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.notification_type === "verification_application" && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {t("Verification", "验证申请")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {notification.link_url && (
                        <div className="flex items-center gap-1 text-primary flex-shrink-0">
                          <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminNotifications;