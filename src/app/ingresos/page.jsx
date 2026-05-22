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

const INCOME_CATEGORIES = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'otros', label: 'Otros' }
];

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'mercado pago', label: 'Mercado Pago' },
  { value: 'otros', label: 'Otros' }
];

export default function Ingresos() {
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
      const response = await fetch('/api/transactions?type=income');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data);
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
      addToast('Error al cargar los ingresos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        type: 'income',
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
        addToast(editMode ? 'Ingreso actualizado' : 'Ingreso creado', 'success');
        setModalOpen(false);
        resetForm();
        fetchTransactions();
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error saving income:', error);
      addToast('Error al guardar el ingreso', 'error');
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
        addToast('Ingreso eliminado', 'success');
        setDeleteConfirmOpen(false);
        setTransactionToDelete(null);
        fetchTransactions();
      } else {
        addToast(data.message, 'error');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      addToast('Error al eliminar el ingreso', 'error');
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
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ingresos
            </h1>
            <p className="text-slate-600 mt-1 text-sm lg:text-base">Gestiona tus ingresos diarios</p>
          </div>
          <Button onClick={openCreateModal} className="w-full sm:w-auto">
            + Nuevo Ingreso
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base lg:text-xl">Lista de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-10 h-10 lg:w-12 lg:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                title="No hay ingresos registrados"
                description="Comienza registrando tu primer ingreso"
                action={
                  <Button onClick={openCreateModal} className="w-full sm:w-auto">
                    Registrar ingreso
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                    <TableHead className="hidden md:table-cell">Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="hidden sm:table-cell">Acciones</TableHead>
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
                      <TableCell className="hidden lg:table-cell">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.paymentMethod || '-'}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold text-sm lg:text-base">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
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

        {/* Mobile Action Button */}
        {transactions.length > 0 && (
          <div className="fixed bottom-4 right-4 lg:hidden z-40">
            <Button
              onClick={openCreateModal}
              className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
              aria-label="Nuevo ingreso"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            resetForm();
          }}
          title={editMode ? 'Editar Ingreso' : 'Nuevo Ingreso'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Categoría"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={INCOME_CATEGORIES}
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
              placeholder="Descripción del ingreso"
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

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
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
            <p className="text-gray-600 text-sm lg:text-base">
              ¿Estás seguro de que deseas eliminar este ingreso? Esta acción no se puede deshacer.
            </p>
            {transactionToDelete && (
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-sm">
                  <strong>Categoría:</strong> {transactionToDelete.category}
                </p>
                <p className="text-sm">
                  <strong>Monto:</strong> {formatCurrency(transactionToDelete.amount)}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setTransactionToDelete(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
