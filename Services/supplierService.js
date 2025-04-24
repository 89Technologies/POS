import axios from 'axios';
import { getAuth } from 'firebase/auth';

const auth=getAuth();

// Configure your base API URL
const BASE_API_URL = 'http://192.168.155.11:8000/Sales'; // Replace with your actual backend URL

// Helper function to get Firebase user ID
const getFirebaseUserId = async () => {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
};

// Supplier Service Functions
export const getSuppliersByBranch = async () => {
  try {
    const firebaseId = await getFirebaseUserId();
    const response = await axios.get(`${BASE_API_URL}/suppliers/by-branch/${firebaseId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const firebaseId = await getFirebaseUserId();
    const response = await axios.post(
      `${BASE_API_URL}/suppliers/create/${firebaseId}/`,
      supplierData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
};

export const updateSupplier = async (supplierId, supplierData) => {
  try {
    const firebaseId = await getFirebaseUserId();
    const response = await axios.put(
      `${BASE_API_URL}/suppliers/update/${firebaseId}/${supplierId}/`,
      supplierData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (supplierId) => {
  try {
    const firebaseId = await getFirebaseUserId();
    const response = await axios.delete(
      `${BASE_API_URL}/suppliers/delete/${firebaseId}/${supplierId}/`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};