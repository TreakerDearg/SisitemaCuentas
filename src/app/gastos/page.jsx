'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, NumberInput, DateInput } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Loading, TableSkeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate, formatInputDate, getTodayDate, getCategoryColor } from '../../utils/format';
import { useToast } from '../../utils/toast';

const EXPENSE_CATEGORIES = [
  { value: 'combustible', label: 'Combustible' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'peajes', label: 'Peajes' },
  { value: 'compras', label: 'Compras' },
  { value: 'otros', label: 'Otros' }
];

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mercado pago', label: 'Mercado Pago' },
  { value: 'otros', label: 'Otros' }
];

export default function Gastos() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    paymentMethod: '',
    date: getTodayDate()
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transactions?type=expense');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data);
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      addToast('Error al cargar los gastos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        type: 'expense',
        ...formData,
        amount: parseFloat(formData.amount)
      };

      const url = editMode && currentTransaction 
        ? `/api/transactions/${currentTransaction._id}`
        : '/api/transactions';
      
      const method = editMode && currentTransaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        addToast(editMode ? 'Gasto actualizado' : 'Gasto creado', 'success');
        setModalOpen(false);
        resetForm();
        fetchTransactions();
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      addToast('Error al guardar el gasto', 'error');
    }
  };

  const handleEdit = (transaction) => {
    setCurrentTransaction(transaction);
    setFormData({
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description || '',
      paymentMethod: transaction.paymentMethod || '',
      date: formatInputDate(transaction.date)
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await fetch(`/api/transactions/${transactionToDelete._id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        addToast('Gasto eliminado', 'success');
        setDeleteConfirmOpen(false);
        setTransactionToDelete(null);
        fetchTransactions();
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      addToast('Error al eliminar el gasto', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      description: '',
      paymentMethod: '',
      date: getTodayDate()
    });
    setCurrentTransaction(null);
    setEditMode(false);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <TableSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gastos</h1>
            <p className="text-gray-600 mt-1">Gestiona tus gastos diarios</p>
          </div>
          <Button onClick={openCreateModal}>
            + Nuevo Gasto
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                }
                title="No hay gastos registrados"
                description="Comienza registrando tu primer gasto"
                action={
                  <Button onClick={openCreateModal}>
                    Registrar gasto
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Método de pago</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
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
                      <TableCell className="text-red-600 font-semibold">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setTransactionToDelete(transaction);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            resetForm();
          }}
          title={editMode ? 'Editar Gasto' : 'Nuevo Gasto'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Categoría"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={EXPENSE_CATEGORIES}
              required
            />

            <NumberInput
              label="Monto"
              name="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              min="0"
              step="0.01"
            />

            <Input
              label="Descripción"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del gasto"
            />

            <Select
              label="Método de pago"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={PAYMENT_METHODS}
            />

            <DateInput
              label="Fecha"
              name="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editMode ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setTransactionToDelete(null);
          }}
          title="Confirmar eliminación"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
            </p>
            {transactionToDelete && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Categoría:</strong> {transactionToDelete.category}
                </p>
                <p className="text-sm">
                  <strong>Monto:</strong> {formatCurrency(transactionToDelete.amount)}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setTransactionToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
