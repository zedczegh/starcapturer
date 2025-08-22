import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast, toast } from "@/hooks/use-toast";
import ApplicationMaterials from "@/components/admin/ApplicationMaterials";

interface UserApplication {
  id: string;
  spot_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  bortle_level: number | null;
  bortle_measurement_url: string | null;
  facility_images_urls: string[] | null;
  accommodation_description: string | null;
  additional_notes: string | null;
  admin_notes: string | null;
  spot: {
    id: string;
    name: string;
    description: string | null;
    latitude: number;
    longitude: number;
    verification_status: string;
  };
}

const UserApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUserApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('astro_spot_verification_applications')
        .select(`
          *,
          spot:user_astro_spots(
            id,
            name,
            description,
            latitude,
            longitude,
            verification_status
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, [user]);

  const handleWithdrawApplication = async (applicationId: string) => {
    setWithdrawing(applicationId);
    try {
      const { error } = await supabase
        .from('astro_spot_verification_applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId)
        .eq('applicant_id', user?.id);

      if (error) {
        console.error('Error withdrawing application:', error);
        toast.error("Error", "Failed to withdraw application. Please try again.");
        return;
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'withdrawn', updated_at: new Date().toISOString() }
          : app
      ));

      toast.success("Application Withdrawn", "Your verification application has been successfully withdrawn.");
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error("Error", "Failed to withdraw application. Please try again.");
    } finally {
      setWithdrawing(null);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    setDeleting(applicationId);
    try {
      const { error } = await supabase
        .from('astro_spot_verification_applications')
        .delete()
        .eq('id', applicationId)
        .eq('applicant_id', user?.id)
        .eq('status', 'withdrawn'); // Only allow deletion of withdrawn applications

      if (error) {
        console.error('Error deleting application:', error);
        toast.error("Error", "Failed to delete application. Please try again.");
        return;
      }

      // Remove from local state
      setApplications(prev => prev.filter(app => app.id !== applicationId));

      toast.success("Application Deleted", "Your verification application has been permanently deleted.");
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error("Error", "Failed to delete application. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertCircle, label: 'Pending Review' },
      approved: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Rejected' },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: XCircle, label: 'Withdrawn' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-card rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Found</h3>
        <p className="text-muted-foreground">
          You haven't submitted any verification applications yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Verification Applications</h2>
          <p className="text-muted-foreground">Track the status of your astro spot verification applications</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {applications.length} Application{applications.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id} className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {application.spot.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Applied {formatDistanceToNow(new Date(application.created_at))} ago
                    </span>
                    {application.reviewed_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Reviewed {formatDistanceToNow(new Date(application.reviewed_at))} ago
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(application.status)}
                  {application.status === 'pending' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          disabled={withdrawing === application.id}
                          title="Withdraw application"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to withdraw your verification application for "{application.spot.name}"?
                            You can permanently delete it later if needed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleWithdrawApplication(application.id)}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            Withdraw
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {application.status === 'withdrawn' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          disabled={deleting === application.id}
                          title="Delete application permanently"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete your verification application for "{application.spot.name}"?
                            This action cannot be undone and all application data will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteApplication(application.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {application.spot.description && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Spot Description</h4>
                  <p className="text-sm text-muted-foreground">{application.spot.description}</p>
                </div>
              )}

              {application.accommodation_description && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Accommodation Details</h4>
                  <p className="text-sm text-muted-foreground">{application.accommodation_description}</p>
                </div>
              )}

              {application.additional_notes && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Additional Notes</h4>
                  <p className="text-sm text-muted-foreground">{application.additional_notes}</p>
                </div>
              )}

              {application.bortle_level && (
                <div>
                  <h4 className="font-medium text-foreground mb-1">Bortle Scale Level</h4>
                  <Badge variant="outline" className="text-xs">
                    Level {application.bortle_level}
                  </Badge>
                </div>
              )}

              <ApplicationMaterials
                application={{
                  bortle_measurement_url: application.bortle_measurement_url,
                  facility_images_urls: application.facility_images_urls
                }}
              />

              {application.admin_notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
                      Admin Review Notes
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border border-border/30">
                      {application.admin_notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserApplications;