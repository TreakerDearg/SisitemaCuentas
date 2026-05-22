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
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Caja Diaria</h1>
            <p className="text-gray-600 mt-1">Resumen de movimientos del día</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goToPreviousDay}>
              ← Anterior
            </Button>
            <Button variant="secondary" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="secondary" onClick={goToNextDay}>
              Siguiente →
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="pt-6">
            <DateInput
              label="Seleccionar fecha"
              name="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.income)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {summary.transactions.filter(t => t.type === 'income').length} operaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(summary.expense)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {summary.transactions.filter(t => t.type === 'expense').length} operaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Resultado del día
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos del día</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay movimientos para esta fecha</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Método de pago</TableHead>
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
                          <span className="capitalize">
                            {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell>
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
