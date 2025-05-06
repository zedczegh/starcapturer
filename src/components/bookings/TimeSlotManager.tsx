
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { format, addDays, isSameDay, isWithinInterval, setHours, setMinutes, setSeconds } from 'date-fns';
import { DateRange } from "react-day-picker";
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useModal } from "@/contexts/ModalContext";
import { Badge } from "@/components/ui/badge";
import { useMessaging } from "@/hooks/useMessaging";

const TimeSlotManager = ({ spotId, creatorId, spotName }: {
  spotId: string;
  creatorId: string;
  spotName: string;
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModal();

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: Date; end_time: Date } | null>(null);
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDateValid, setIsDateValid] = useState(true);
  const { sendBookingNotification } = useMessaging();

  useEffect(() => {
    if (location.state?.date) {
      setDate({ from: new Date(location.state.date), to: addDays(new Date(location.state.date), 6) });
    }
  }, [location.state]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!date?.from || !date?.to) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('astro_spot_timeslots')
          .select('*')
          .eq('spot_id', spotId)
          .gte('start_time', format(date.from, 'yyyy-MM-dd'))
          .lte('start_time', format(date.to, 'yyyy-MM-dd'));

        if (error) {
          console.error("Error fetching available time slots:", error);
          toast.error(t("Failed to load available slots", "加载可用时段失败"));
        } else {
          setAvailableSlots(data || []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [date, spotId, t]);

  const isDateBooked = (day: Date) => {
    return availableSlots.some(slot => isSameDay(new Date(slot.start_time), day));
  };

  const handleTimeSlotSelect = (slot: any) => {
    setSelectedSlot({
      start_time: new Date(slot.start_time),
      end_time: new Date(slot.end_time)
    });
  };

  const isTimeSlotAvailable = (startTime: Date, endTime: Date) => {
    return availableSlots.some(slot => {
      const slotStartTime = new Date(slot.start_time);
      const slotEndTime = new Date(slot.end_time);
      return slotStartTime.getTime() === startTime.getTime() && slotEndTime.getTime() === endTime.getTime();
    });
  };

  const generateTimeSlots = (date: Date) => {
    const slots = [];
    for (let i = 8; i < 20; i++) {
      const startTime = setMinutes(setHours(setSeconds(date, 0), i), 0);
      const endTime = setMinutes(setHours(setSeconds(date, 0), i + 1), 0);
      
      const isAvailable = isTimeSlotAvailable(startTime, endTime);
      slots.push({ startTime, endTime, available: isAvailable });
    }
    return slots;
  };

  const handleReservationSubmit = async () => {
    if (!selectedSlot) {
      toast.error(t("Please select a time slot", "请选择一个时间段"));
      return;
    }

    if (!date?.from) {
      toast.error(t("Please select a date range", "请选择一个日期范围"));
      return;
    }

    if (!user) {
      openModal({
        title: t("Sign In Required", "需要登录"),
        description: t("You must sign in to make a reservation.", "您必须登录才能进行预订。"),
        buttons: {
          confirm: {
            label: t("Sign In", "登录"),
            action: () => navigate('/profile'),
          },
          cancel: {
            label: t("Cancel", "取消"),
          },
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('astro_spot_reservations')
        .insert([
          {
            spot_id: spotId,
            user_id: user.id,
            start_time: selectedSlot.start_time.toISOString(),
            end_time: selectedSlot.end_time.toISOString(),
            notes: notes,
          },
        ]);

      if (error) {
        console.error("Error creating reservation:", error);
        toast.error(t("Failed to create reservation", "创建预订失败"));
      } else {
        toast.success(t("Reservation created successfully", "预订成功"));
        navigate('/profile');
      }
      
      // After successful reservation, send a notification message to the creator
      if (data) {
        // Format the time slot for the message
        const formattedDate = format(selectedSlot.start_time, 'PPP');
        const formattedStartTime = format(selectedSlot.start_time, 'p');
        const formattedEndTime = format(selectedSlot.end_time, 'p');
        const timeSlotInfo = `${formattedDate}, ${formattedStartTime} - ${formattedEndTime}`;
        
        // Send the notification message
        await sendBookingNotification(creatorId, spotName, timeSlotInfo);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate && newDate.from && newDate.to) {
      setIsDateValid(true);
    } else {
      setIsDateValid(false);
    }
    setSelectedSlot(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-white">{t("Book a Time Slot", "预订时间段")}</h2>

      <div className="mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={
                "w-[300px] justify-start text-left font-normal" +
                (date?.from ? " text-white" : " text-muted-foreground")
              }
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
                ) : (
                  format(date.from, "PPP")
                )
              ) : (
                <span>{t("Pick a date range", "选择日期范围")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-cosmic-700/50 glassmorphism">
            <CalendarUI
              mode="range"
              defaultMonth={location.state?.date ? new Date(location.state.date) : undefined}
              selected={date}
              onSelect={handleDateChange}
              disabled={(date) =>
                date < new Date() || isDateBooked(date)
              }
              numberOfMonths={2}
              pagedNavigation
            />
          </PopoverContent>
        </Popover>
        {!isDateValid && (
          <p className="text-red-500 text-sm mt-1">
            {t("Please select a valid date range.", "请选择有效的日期范围。")}
          </p>
        )}
      </div>

      {date?.from && date?.to && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-white">{t("Available Time Slots", "可用时间段")}</h3>
          {loading ? (
            <p className="text-cosmic-300">{t("Loading available time slots...", "加载可用时间段...")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 }).map((_, i) => {
                const currentDate = addDays(date.from, i);
                const slots = generateTimeSlots(currentDate);
                
                if (slots.every(slot => !slot.available)) {
                  return null;
                }
                
                return (
                  <div key={i} className="space-y-2">
                    <p className="text-lg font-medium text-white">{format(currentDate, "PPP")}</p>
                    {slots.map((slot, index) => (
                      slot.available && (
                        <Badge
                          key={index}
                          variant={
                            selectedSlot?.start_time === slot.startTime && selectedSlot?.end_time === slot.endTime
                              ? "default"
                              : "cosmic"
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            handleTimeSlotSelect({
                              start_time: slot.startTime,
                              end_time: slot.endTime,
                            })
                          }
                        >
                          {format(slot.startTime, "h:mm a")} - {format(slot.endTime, "h:mm a")}
                        </Badge>
                      )
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3 text-white">{t("Selected Time Slot", "选定的时间段")}</h3>
          <p className="text-cosmic-300">
            {t("Start Time", "开始时间")}: {format(selectedSlot.start_time, "PPP h:mm a")}
          </p>
          <p className="text-cosmic-300">
            {t("End Time", "结束时间")}: {format(selectedSlot.end_time, "PPP h:mm a")}
          </p>
        </div>
      )}

      <div className="mb-6">
        <Label htmlFor="notes" className="text-white">{t("Additional Notes", "附加说明")}</Label>
        <Textarea
          id="notes"
          placeholder={t("Enter any additional notes here...", "在此处输入任何附加说明...")}
          className="bg-cosmic-800/30 border-cosmic-700/50 focus-visible:border-primary/50 text-white"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleReservationSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? t("Submitting Reservation...", "提交预订中...")
          : t("Submit Reservation", "提交预订")}
      </Button>
    </div>
  );
};

export default TimeSlotManager;
