import api from './api';

export type FeeType = 'tuition' | 'admission' | 'exam' | 'transport' | 'other';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type PaymentMethod = 'cash' | 'bank' | 'online' | 'other';

export interface FeeStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface Fee {
  _id: string;

  studentId: string | FeeStudent;

  feeType: FeeType;

  academicSession: string;

  month: string | null;

  totalAmount: number;

  paidAmount: number;

  remainingAmount: number;

  status: PaymentStatus;

  dueDate: string;

  paymentDate: string | null;

  paymentMethod: PaymentMethod | null;

  notes: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface CreateFeePayload {
  studentId: string;

  feeType: FeeType;

  academicSession: string;

  month?: string;

  totalAmount: number;

  dueDate: string;

  paymentDate?: string;

  paymentMethod?: PaymentMethod;

  notes?: string;
}

export interface UpdateFeePayload {
  feeType?: FeeType;

  academicSession?: string;

  month?: string;

  totalAmount?: number;

  dueDate?: string;

  paymentDate?: string;

  paymentMethod?: PaymentMethod;

  notes?: string;
}

export const getFees = async (): Promise<Fee[]> => {
  const response = await api.get('/fees');

  return response.data;
};

export const getFee = async (feeId: string): Promise<Fee> => {
  const response = await api.get(`/fees/${feeId}`);

  return response.data;
};

export const getFeesByStudent = async (studentId: string): Promise<Fee[]> => {
  const response = await api.get(`/fees/student/${studentId}`);

  return response.data;
};

export const createFee = async (payload: CreateFeePayload): Promise<Fee> => {
  const response = await api.post('/fees', payload);

  return response.data;
};

export const updateFee = async (
  feeId: string,
  payload: UpdateFeePayload,
): Promise<Fee> => {
  const response = await api.patch(`/fees/${feeId}`, payload);

  return response.data;
};

export const deleteFee = async (feeId: string) => {
  const response = await api.delete(`/fees/${feeId}`);

  return response.data;
};
