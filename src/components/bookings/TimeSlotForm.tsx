
import React from 'react';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  description: string;
  price: number;
  currency: string;
}

interface TimeSlotFormProps {
  initialData: TimeSlot | null;
  onSuccess: (data: {
    start_time: string;
    end_time: string;
    max_capacity: number;
    description: string;
    price: number;
    currency: string;
  }) => void;
  onCancel: () => void;
}

const TimeSlotForm: React.FC<TimeSlotFormProps> = ({ 
  initialData,
  onSuccess,
  onCancel
}) => {
  const { t } = useLanguage();
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      start_time: initialData?.start_time?.slice(0, 16) || '',
      end_time: initialData?.end_time?.slice(0, 16) || '',
      max_capacity: initialData?.max_capacity || 5,
      description: initialData?.description || '',
      price: initialData?.price || 0,
      currency: initialData?.currency || 'USD'
    }
  });
  
  const onSubmit = (data: any) => {
    onSuccess({
      start_time: new Date(data.start_time).toISOString(),
      end_time: new Date(data.end_time).toISOString(),
      max_capacity: parseInt(data.max_capacity, 10),
      description: data.description,
      price: parseFloat(data.price),
      currency: data.currency
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">{t('Start Time', '开始时间')} *</Label>
          <Input
            id="start_time"
            type="datetime-local"
            {...register('start_time', { required: true })}
            className="bg-cosmic-800/50 border-cosmic-700"
          />
          {errors.start_time && (
            <span className="text-red-400 text-sm">{t('Start time is required', '请选择开始时间')}</span>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="end_time">{t('End Time', '结束时间')} *</Label>
          <Input
            id="end_time"
            type="datetime-local"
            {...register('end_time', { required: true })}
            className="bg-cosmic-800/50 border-cosmic-700"
          />
          {errors.end_time && (
            <span className="text-red-400 text-sm">{t('End time is required', '请选择结束时间')}</span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_capacity">{t('Max Capacity', '最大容量')} *</Label>
          <Input
            id="max_capacity"
            type="number"
            min="1"
            {...register('max_capacity', { required: true, min: 1 })}
            className="bg-cosmic-800/50 border-cosmic-700"
          />
          {errors.max_capacity && (
            <span className="text-red-400 text-sm">{t('Valid capacity is required', '请输入有效的容量')}</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <div className="space-y-2 flex-1">
            <Label htmlFor="price">{t('Price', '价格')}</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              {...register('price', { required: true, min: 0 })}
              className="bg-cosmic-800/50 border-cosmic-700"
            />
          </div>
          
          <div className="space-y-2 w-24">
            <Label htmlFor="currency">{t('Currency', '货币')}</Label>
            <Select 
              defaultValue={initialData?.currency || "USD"}
              onValueChange={(value) => setValue('currency', value)}
            >
              <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="CNY">CNY</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">{t('Description (Optional)', '描述（可选）')}</Label>
        <Textarea
          id="description"
          {...register('description')}
          className="bg-cosmic-800/50 border-cosmic-700"
          placeholder={t('Provide details about this time slot...', '提供关于此时段的详细信息...')}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="border-cosmic-700"
        >
          {t('Cancel', '取消')}
        </Button>
        <Button type="submit">
          {initialData ? t('Update', '更新') : t('Create', '创建')}
        </Button>
      </div>
    </form>
  );
};

export default TimeSlotForm;
