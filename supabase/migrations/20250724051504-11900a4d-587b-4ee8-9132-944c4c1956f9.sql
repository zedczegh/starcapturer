-- Create notifications table for admin alerts
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_spot_id UUID,
  related_application_id UUID,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin notifications
CREATE POLICY "Only admins can view notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (has_role('admin'));

CREATE POLICY "Only admins can update notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (has_role('admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify admins about new verification applications
CREATE OR REPLACE FUNCTION public.notify_admins_verification_application()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  spot_record RECORD;
BEGIN
  -- Get spot information
  SELECT name, user_id INTO spot_record
  FROM public.user_astro_spots 
  WHERE id = NEW.spot_id;
  
  -- Create notification for admins about new verification application
  INSERT INTO public.admin_notifications (
    notification_type,
    title,
    message,
    link_url,
    related_spot_id,
    related_application_id,
    metadata
  ) VALUES (
    'verification_application',
    'New Verification Application',
    'A new verification application has been submitted for astrospot: ' || spot_record.name,
    '/astro-spot/' || NEW.spot_id,
    NEW.spot_id,
    NEW.id,
    jsonb_build_object(
      'applicant_id', NEW.applicant_id,
      'spot_name', spot_record.name,
      'application_status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically notify admins when new applications are created
CREATE TRIGGER notify_admins_on_verification_application
  AFTER INSERT ON public.astro_spot_verification_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_verification_application();