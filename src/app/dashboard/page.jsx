'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Loading, TableSkeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/format';
import { useToast } from '../../utils/toast';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's summary
      const today = new Date().toISOString().split('T')[0];
      const summaryResponse = await fetch(`/api/transactions?startDate=${today}&endDate=${today}`);
      const summaryData = await summaryResponse.json();
      
      if (summaryData.success) {
        const income = summaryData.data
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = summaryData.data
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        setSummary({
          income,
          expense,
          balance: income - expense
        });
      }

      // Fetch recent transactions (last 10)
      const transactionsResponse = await fetch('/api/transactions');
      const transactionsData = await transactionsResponse.json();
      
      if (transactionsData.success) {
        setRecentTransactions(transactionsData.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    return type === 'income' ? 'text-emerald-600' : 'text-red-600';
  };

  const getTransactionTypeIcon = (type) => {
    if (type === 'income') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
                <Loading />
              </div>
            ))}
          </div>
          <TableSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pt-2 lg:pt-0">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-2 text-base lg:text-lg">Resumen de tus movimientos del día</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle>Ingresos del día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-bold text-emerald-600">
                {formatCurrency(summary.income)}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle>Gastos del día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-bold text-red-600">
                {formatCurrency(summary.expense)}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle>Balance del día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl lg:text-4xl font-bold ${summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                title="No hay movimientos"
                description="Comienza registrando tus primeros ingresos o gastos"
                action={
                  <Button onClick={() => window.location.href = '/gastos'}>
                    Registrar movimiento
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeIcon(transaction.type)}
                          <span className="capitalize">{transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="capitalize">{transaction.category}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell className={getTransactionTypeColor(transaction.type)}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
