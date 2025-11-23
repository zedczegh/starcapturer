import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, DollarSign, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/currencyUtils';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last_four: string;
  stripe_payment_method_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  status: string;
}

const WalletSection = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [processingTopup, setProcessingTopup] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      if (walletData) {
        setWallet(walletData);
      } else {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase.rpc('get_or_create_wallet', {
          p_user_id: user.id,
          p_currency: 'USD'
        });

        if (createError) throw createError;
        
        // Fetch the created wallet
        const { data: createdWallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (createdWallet) setWallet(createdWallet);
      }

      // Fetch recent transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error(t('Failed to load wallet data', '加载钱包数据失败'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('id, brand, last_four, stripe_payment_method_id')
        .eq('user_id', user.id)
        .not('stripe_payment_method_id', 'is', null);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleTopup = async () => {
    if (!user || !selectedPaymentMethod || !topupAmount) return;

    setProcessingTopup(true);
    try {
      const amount = parseFloat(topupAmount);
      if (amount < 5) {
        throw new Error(t('Minimum top-up amount is $5', '最低充值金额为$5'));
      }

      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          amount,
          currency: 'usd',
          payment_method_id: selectedPaymentMethod
        }
      });

      if (error) throw error;

      if (data.payment_intent.status === 'succeeded') {
        toast.success(t('Wallet topped up successfully', '钱包充值成功'));
        setTopupDialogOpen(false);
        setTopupAmount('');
        setSelectedPaymentMethod('');
        fetchWalletData();
      } else if (data.requires_action) {
        toast.info(t('Additional authentication required', '需要额外认证'));
        // Handle 3D Secure or other authentication flows here
      }

    } catch (error: any) {
      console.error('Error topping up wallet:', error);
      toast.error(t('Failed to top up wallet', '钱包充值失败'), {
        description: error.message
      });
    } finally {
      setProcessingTopup(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'withdrawal':
      case 'payment':
      case 'booking_payment':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-cosmic-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
      case 'deposit':
        return 'text-green-400';
      case 'withdrawal':
      case 'payment':
      case 'booking_payment':
        return 'text-red-400';
      default:
        return 'text-cosmic-400';
    }
  };

  if (loading) {
    return (
      <Card className="glassmorphism p-6 rounded-2xl border-cosmic-700/20">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism p-6 rounded-2xl border-cosmic-700/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-white flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          {t('Wallet', '钱包')}
        </h2>
        <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('Top Up', '充值')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism-strong border-cosmic-700/30">
            <DialogHeader>
              <DialogTitle className="text-white">
                {t('Top Up Wallet', '钱包充值')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="amount" className="text-white mb-2 block">
                  {t('Amount', '金额')}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="0.00"
                  min="5"
                  step="0.01"
                  className="bg-cosmic-800/50 border-cosmic-700/40 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentMethod" className="text-white mb-2 block">
                  {t('Payment Method', '支付方式')}
                </Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/40 text-white">
                    <SelectValue placeholder={t('Select payment method', '选择支付方式')} />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-800 border-cosmic-700/40">
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={method.stripe_payment_method_id} className="text-white">
                        {method.brand?.toUpperCase()} •••• {method.last_four}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleTopup}
                disabled={!topupAmount || !selectedPaymentMethod || processingTopup}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white"
              >
                {processingTopup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('Processing...', '处理中...')}
                  </>
                ) : (
                  t('Top Up Wallet', '钱包充值')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallet Balance */}
      <div className="bg-gradient-to-r from-primary/10 to-[#8A6FD6]/10 p-6 rounded-xl border border-primary/20 mb-6">
        <div className="text-center">
          <p className="text-cosmic-300 text-sm mb-2">{t('Available Balance', '可用余额')}</p>
          <p className="text-3xl font-bold text-white">
            {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          {t('Recent Transactions', '最近交易')}
        </h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-cosmic-400">
            <p>{t('No transactions yet', '暂无交易记录')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-cosmic-800/20 rounded-lg border border-cosmic-700/20"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {transaction.description || transaction.transaction_type}
                    </p>
                    <p className="text-cosmic-400 text-xs">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                    {transaction.transaction_type === 'topup' || transaction.transaction_type === 'deposit' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      transaction.status === 'completed' 
                        ? 'border-green-500/30 text-green-400' 
                        : 'border-yellow-500/30 text-yellow-400'
                    }`}
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default WalletSection;