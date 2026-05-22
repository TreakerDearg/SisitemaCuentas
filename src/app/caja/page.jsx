'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Loading } from '../../components/ui/Loading';
import { DateInput } from '../../components/ui/Input';
import { formatCurrency, formatDate, getTodayDate, getCategoryColor } from '../../utils/format';
import { useToast } from '../../utils/toast';

export default function Caja() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    transactions: []
  });
  const { addToast } = useToast();

  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate]);

  const fetchDailySummary = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/transactions?startDate=${selectedDate}&endDate=${selectedDate}`);
      const data = await response.json();
      
      if (data.success) {
        const income = data.data
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = data.data
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        setSummary({
          income,
          expense,
          balance: income - expense,
          transactions: data.data
        });
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      addToast('Error al cargar el resumen diario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatInputDate(date));
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatInputDate(date));
  };

  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  const formatInputDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTransactionTypeIcon = (type) => {
    if (type === 'income') {
      return (
        <svg className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 lg:p-6">
                <Loading />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Caja Diaria
            </h1>
            <p className="text-slate-600 mt-1 text-sm lg:text-base">Resumen de movimientos del día</p>
          </div>
        </div>

        {/* Date Navigation */}
        <Card>
          <CardContent className="pt-4 lg:pt-6">
            <div className="space-y-4">
              <DateInput
                label="Seleccionar fecha"
                name="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <div className="flex items-center justify-center gap-2">
                <Button variant="secondary" onClick={goToPreviousDay} className="flex-1">
                  ← Anterior
                </Button>
                <Button variant="secondary" onClick={goToToday} className="flex-1">
                  Hoy
                </Button>
                <Button variant="secondary" onClick={goToNextDay} className="flex-1">
                  Siguiente →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-6">
          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle className="text-base lg:text-xl">Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-bold text-green-600">
                {formatCurrency(summary.income)}
              </div>
              <p className="text-xs lg:text-sm text-gray-500 mt-2">
                {summary.transactions.filter(t => t.type === 'income').length} operaciones
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle className="text-base lg:text-xl">Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-bold text-red-600">
                {formatCurrency(summary.expense)}
              </div>
              <p className="text-xs lg:text-sm text-gray-500 mt-2">
                {summary.transactions.filter(t => t.type === 'expense').length} operaciones
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader>
              <CardTitle className="text-base lg:text-xl">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl lg:text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </div>
              <p className="text-xs lg:text-sm text-gray-500 mt-2">
                Resultado del día
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-xl">Movimientos del día</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm lg:text-base">No hay movimientos para esta fecha</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                    <TableHead className="hidden md:table-cell">Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.type)}
                          <span className="capitalize text-xs lg:text-sm">
                            {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.paymentMethod || '-'}
                      </TableCell>
                      <TableCell className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
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
