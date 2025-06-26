
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Wallet, Plus, CreditCard, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import BackButton from '@/components/navigation/BackButton';

const WalletPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', selectedCurrency)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async ({ amount, paymentType }: { amount: number; paymentType: string }) => {
      const { data, error } = await supabase.functions.invoke('add-funds', {
        body: {
          amount,
          currency: selectedCurrency,
          paymentType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('Failed to add funds', '添加资金失败'));
    }
  });

  const handleAddFunds = () => {
    const amount = parseFloat(addFundsAmount);
    if (!amount || amount <= 0) {
      toast.error(t('Please enter a valid amount', '请输入有效金额'));
      return;
    }

    addFundsMutation.mutate({
      amount,
      paymentType: selectedPaymentMethod
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
      case 'booking_payment':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'booking_received':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { color: 'bg-green-600/20 text-green-400', text: t('Completed', '已完成') },
      pending: { color: 'bg-yellow-600/20 text-yellow-400', text: t('Pending', '待处理') },
      failed: { color: 'bg-red-600/20 text-red-400', text: t('Failed', '失败') },
      cancelled: { color: 'bg-gray-600/20 text-gray-400', text: t('Cancelled', '已取消') }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">{t('Please sign in to access your wallet', '请登录以访问您的钱包')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
              <Wallet className="h-8 w-8" />
              {t('My Wallet', '我的钱包')}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Balance Card */}
          <Card className="bg-cosmic-800/60 border-cosmic-700/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">
                {t('Balance', '余额')}
              </h2>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-20 bg-cosmic-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="RMB">RMB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-3xl font-bold text-green-400 mb-4">
              {walletLoading ? '...' : formatCurrency(wallet?.balance || 0, selectedCurrency)}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm text-gray-300">
                  {t('Add Funds Amount', '添加资金金额')}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-300">
                  {t('Payment Method', '支付方式')}
                </Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-800 border-cosmic-700">
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('Credit/Debit Card', '信用卡/借记卡')}
                      </div>
                    </SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="wechat">{t('WeChat Pay', '微信支付')}</SelectItem>
                    <SelectItem value="alipay">{t('Alipay', '支付宝')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddFunds}
                disabled={addFundsMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addFundsMutation.isPending 
                  ? t('Processing...', '处理中...') 
                  : t('Add Funds', '添加资金')}
              </Button>
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="lg:col-span-2 bg-cosmic-800/60 border-cosmic-700/40 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              {t('Transaction History', '交易记录')}
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactionsLoading ? (
                <div className="text-center py-8 text-gray-400">
                  {t('Loading transactions...', '加载交易记录中...')}
                </div>
              ) : transactions?.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {t('No transactions yet', '暂无交易记录')}
                </div>
              ) : (
                transactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-cosmic-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <div className="font-medium text-gray-200">
                          {transaction.description || transaction.transaction_type}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
