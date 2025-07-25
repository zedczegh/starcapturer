import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Plus, Trash2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddPaymentMethodForm from './AddPaymentMethodForm';

interface PaymentMethod {
  id: string;
  brand: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  payment_type: string;
}

const PaymentMethodsSection = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error(t('Failed to load payment methods', '加载支付方式失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user) return;

    try {
      // First, unset all current defaults
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Then set the new default
      const { error } = await supabase
        .from('user_payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (error) throw error;

      toast.success(t('Default payment method updated', '默认支付方式已更新'));
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error(t('Failed to update default payment method', '更新默认支付方式失败'));
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_payment_methods')
        .delete()
        .eq('id', methodId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('Payment method removed', '支付方式已移除'));
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error(t('Failed to remove payment method', '移除支付方式失败'));
    }
  };

  const getBrandIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <Card className="glassmorphism p-6 rounded-2xl border-cosmic-700/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-white">
          {t('Payment Methods', '支付方式')}
        </h2>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('Add', '添加')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism-strong border-cosmic-700/30">
            <DialogHeader>
              <DialogTitle className="text-white">
                {t('Add Payment Method', '添加支付方式')}
              </DialogTitle>
            </DialogHeader>
            <AddPaymentMethodForm 
              onSuccess={() => {
                setAddDialogOpen(false);
                fetchPaymentMethods();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-cosmic-800/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-cosmic-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('No payment methods added yet', '尚未添加支付方式')}</p>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 bg-cosmic-800/20 rounded-lg border border-cosmic-700/20 hover:bg-cosmic-700/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getBrandIcon(method.brand)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">
                      {method.brand?.toUpperCase()} •••• {method.last_four}
                    </span>
                    {method.is_default && (
                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                        <Check className="w-3 h-3 mr-1" />
                        {t('Default', '默认')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-cosmic-400">
                    {t('Expires', '过期时间')} {method.exp_month}/{method.exp_year}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!method.is_default && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSetDefault(method.id)}
                    className="text-cosmic-400 hover:text-white hover:bg-cosmic-700/30"
                  >
                    {t('Set Default', '设为默认')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(method.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default PaymentMethodsSection;