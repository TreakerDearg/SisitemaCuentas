import Transaction from '../models/Transaction.js';
import connectToDatabase from '../lib/mongodb.js';

export const transactionCategories = {
  income: ['efectivo', 'transferencia', 'alquiler', 'otros'],
  expense: ['combustible', 'mantenimiento', 'peajes', 'compras', 'otros']
};

export const paymentMethods = ['efectivo', 'transferencia', 'tarjeta', 'mercado pago', 'otros'];

export async function getAllTransactions(filters = {}) {
  try {
    await connectToDatabase();
    
    const query = {};
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }
    
    if (filters.search) {
      query.$or = [
        { description: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { success: false, message: 'Error al obtener transacciones' };
  }
}

export async function getTransactionById(id) {
  try {
    await connectToDatabase();
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return { success: false, message: 'Transacción no encontrada' };
    }
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error getting transaction:', error);
    return { success: false, message: 'Error al obtener transacción' };
  }
}

export async function createTransaction(data) {
  try {
    await connectToDatabase();
    
    // Validate required fields
    if (!data.type || !data.category || !data.amount || !data.date) {
      return { success: false, message: 'Faltan campos requeridos' };
    }
    
    // Validate type
    if (!['income', 'expense'].includes(data.type)) {
      return { success: false, message: 'Tipo de transacción inválido' };
    }
    
    // Validate category
    const validCategories = transactionCategories[data.type];
    if (!validCategories.includes(data.category)) {
      return { success: false, message: 'Categoría inválida' };
    }
    
    // Validate amount
    if (isNaN(data.amount) || data.amount < 0) {
      return { success: false, message: 'Monto inválido' };
    }
    
    const transaction = new Transaction({
      type: data.type,
      category: data.category,
      amount: parseFloat(data.amount),
      description: data.description || '',
      paymentMethod: data.paymentMethod || '',
      date: new Date(data.date)
    });
    
    await transaction.save();
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, message: 'Error al crear transacción' };
  }
}

export async function updateTransaction(id, data) {
  try {
    await connectToDatabase();
    
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return { success: false, message: 'Transacción no encontrada' };
    }
    
    // Update fields
    if (data.type) {
      if (!['income', 'expense'].includes(data.type)) {
        return { success: false, message: 'Tipo de transacción inválido' };
      }
      transaction.type = data.type;
    }
    
    if (data.category) {
      const validCategories = transactionCategories[transaction.type];
      if (!validCategories.includes(data.category)) {
        return { success: false, message: 'Categoría inválida' };
      }
      transaction.category = data.category;
    }
    
    if (data.amount !== undefined) {
      if (isNaN(data.amount) || data.amount < 0) {
        return { success: false, message: 'Monto inválido' };
      }
      transaction.amount = parseFloat(data.amount);
    }
    
    if (data.description !== undefined) {
      transaction.description = data.description;
    }
    
    if (data.paymentMethod !== undefined) {
      transaction.paymentMethod = data.paymentMethod;
    }
    
    if (data.date) {
      transaction.date = new Date(data.date);
    }
    
    await transaction.save();
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, message: 'Error al actualizar transacción' };
  }
}

export async function deleteTransaction(id) {
  try {
    await connectToDatabase();
    
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return { success: false, message: 'Transacción no encontrada' };
    }
    
    await Transaction.findByIdAndDelete(id);
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, message: 'Error al eliminar transacción' };
  }
}

export async function getDailySummary(date) {
  try {
    await connectToDatabase();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    return {
      success: true,
      data: {
        income,
        expense,
        balance,
        transactions,
        date: startOfDay
      }
    };
  } catch (error) {
    console.error('Error getting daily summary:', error);
    return { success: false, message: 'Error al obtener resumen diario' };
  }
}

export async function getOverallSummary(startDate, endDate) {
  try {
    await connectToDatabase();
    
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    const transactions = await Transaction.find(query);
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    return {
      success: true,
      data: {
        income,
        expense,
        balance,
        transactionCount: transactions.length
      }
    };
  } catch (error) {
    console.error('Error getting overall summary:', error);
    return { success: false, message: 'Error al obtener resumen general' };
  }
}
