import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Loader2, 
  CreditCard, 
  Trash2, 
  Check,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/currencyUtils';
import PaymentMethodsSection from '@/components/profile/PaymentMethodsSection';

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
  currency: string;
}

const MyWallet = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [processingTopup, setProcessingTopup] = useState(false);
  const [processingWithdraw, setProcessingWithdraw] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/photo-points');
      return;
    }
    fetchWalletData();
    fetchPaymentMethods();
  }, [user, navigate]);

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

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
          .single();
        
        if (createdWallet) setWallet(createdWallet);
      }

      // Fetch all transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

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

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount) return;

    setProcessingWithdraw(true);
    try {
      const amount = parseFloat(withdrawAmount);
      if (amount < 1) {
        throw new Error(t('Minimum withdrawal amount is $1', '最低提现金额为$1'));
      }

      if (wallet && amount > wallet.balance) {
        throw new Error(t('Insufficient balance', '余额不足'));
      }

      // For now, just record the withdrawal request
      // In a real implementation, you'd integrate with Stripe transfers
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: -amount,
        p_transaction_type: 'withdrawal',
        p_currency: 'USD',
        p_description: 'Withdrawal request'
      });

      if (error) throw error;

      toast.success(t('Withdrawal request submitted', '提现请求已提交'));
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      fetchWalletData();

    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      toast.error(t('Failed to process withdrawal', '提现处理失败'), {
        description: error.message
      });
    } finally {
      setProcessingWithdraw(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'payment':
      case 'booking_payment':
        return <ArrowUpRight className="w-5 h-5 text-blue-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-cosmic-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
      case 'deposit':
        return 'text-green-400';
      case 'withdrawal':
        return 'text-red-400';
      case 'payment':
      case 'booking_payment':
        return 'text-blue-400';
      default:
        return 'text-cosmic-400';
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'topup':
      case 'deposit':
        return '+';
      case 'withdrawal':
      case 'payment':
      case 'booking_payment':
        return '-';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
        <NavBar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-cosmic-200">{t('Loading wallet...', '加载钱包中...')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            {t('My Wallet', '我的钱包')}
          </h1>
          <p className="text-cosmic-300">
            {t('Manage your payments and transactions', '管理您的支付和交易')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Wallet Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="glassmorphism p-8 rounded-2xl border-cosmic-700/20">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-primary/20 to-[#8A6FD6]/20 p-8 rounded-2xl border border-primary/30 backdrop-blur-sm">
                  <p className="text-cosmic-300 text-lg mb-3">{t('Available Balance', '可用余额')}</p>
                  <p className="text-5xl font-bold text-white mb-6">
                    {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-6 py-3">
                          <Download className="w-4 h-4 mr-2" />
                          {t('Add Money', '充值')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glassmorphism-strong border-cosmic-700/30">
                        <DialogHeader>
                          <DialogTitle className="text-white">
                            {t('Add Money to Wallet', '钱包充值')}
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
                              className="bg-cosmic-800/50 border-cosmic-700/40 text-white text-lg p-4"
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
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white py-3"
                          >
                            {processingTopup ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('Processing...', '处理中...')}
                              </>
                            ) : (
                              t('Add Money', '充值')
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-6 py-3"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {t('Withdraw', '提现')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glassmorphism-strong border-cosmic-700/30">
                        <DialogHeader>
                          <DialogTitle className="text-white">
                            {t('Withdraw Money', '提现')}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div>
                            <Label htmlFor="withdrawAmount" className="text-white mb-2 block">
                              {t('Amount', '金额')}
                            </Label>
                            <Input
                              id="withdrawAmount"
                              type="number"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="0.00"
                              min="1"
                              max={wallet?.balance || 0}
                              step="0.01"
                              className="bg-cosmic-800/50 border-cosmic-700/40 text-white text-lg p-4"
                            />
                            <p className="text-xs text-cosmic-400 mt-1">
                              {t('Available balance:', '可用余额:')} {wallet ? formatCurrency(wallet.balance) : '$0.00'}
                            </p>
                          </div>
                          
                          <Button
                            onClick={handleWithdraw}
                            disabled={!withdrawAmount || processingWithdraw}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white py-3"
                          >
                            {processingWithdraw ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('Processing...', '处理中...')}
                              </>
                            ) : (
                              t('Withdraw Money', '提现')
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>

            {/* Transaction History */}
            <Card className="glassmorphism p-6 rounded-2xl border-cosmic-700/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  {t('Transaction History', '交易历史')}
                </h2>
                <Badge variant="outline" className="text-cosmic-300 border-cosmic-600">
                  {transactions.length} {t('transactions', '笔交易')}
                </Badge>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-cosmic-400">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{t('No transactions yet', '暂无交易记录')}</p>
                  <p className="text-sm">{t('Your transaction history will appear here', '您的交易历史将显示在这里')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-cosmic-800/20 rounded-lg border border-cosmic-700/20 hover:bg-cosmic-700/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="text-white font-medium">
                            {transaction.description || transaction.transaction_type}
                          </p>
                          <p className="text-cosmic-400 text-sm">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                          {getTransactionSign(transaction.transaction_type)}
                          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
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
            </Card>
          </div>

          {/* Sidebar - Payment Methods */}
          <div className="lg:col-span-1">
            <PaymentMethodsSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyWallet;