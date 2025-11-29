import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiUploadCloud, FiMic, FiLoader } from 'react-icons/fi';

const categoryColorMapping = {
  'Entertainment': 'bg-purple-500',
  'Income': 'bg-green-500',
  'Groceries': 'bg-blue-500',
  'Transport': 'bg-orange-500',
  'Housing': 'bg-red-500',
  'Cash': 'bg-pink-500',
  'Other': 'bg-yellow-500',
  'Uncategorized': 'bg-gray-500',
};

const getCategoryColor = (category) => {
  return categoryColorMapping[category] || 'bg-gray-500';
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/transactions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions.');
      }
      const data = await response.json();
      const formattedData = data.map(tx => ({
        ...tx,
        date: tx.transaction_date,
        categoryColor: getCategoryColor(tx.category),
      }));
      setTransactions(formattedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Memoize filtered transactions for performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (searchTerm === '') return true;
      return tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [transactions, searchTerm]);

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/v1/transactions/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'File upload failed.' }));
        throw new Error(errorData.detail);
      }
      
      // Refresh transactions after successful upload
      await fetchTransactions();

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-[#1a202c] text-gray-200 p-8 flex-1 relative h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Transactions</h1>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Import Transactions Box */}
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-8 relative">
        {uploading && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center rounded-lg z-10">
            <FiLoader className="animate-spin text-blue-400 text-4xl mb-4" />
            <p className="text-lg font-semibold">Uploading file...</p>
          </div>
        )}
        <FiUploadCloud className="mx-auto text-gray-400 text-4xl mb-4" />
        <h2 className="text-xl font-semibold mb-2">Import Your Transactions</h2>
        <p className="text-gray-400 mb-4">
          Drag & drop your Bank CSV here, or click to browse.
        </p>
        <label className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
          Browse Files
          <input type="file" className="hidden" onChange={handleFileImport} accept=".csv" disabled={uploading} />
        </label>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-6">{error}</div>}

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-gray-800/50 rounded-lg">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Description</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-16">
                  <FiLoader className="animate-spin text-blue-400 text-4xl mx-auto" />
                </td>
              </tr>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-gray-300">{formatDate(tx.date)}</td>
                  <td className="px-6 py-4 font-medium text-white">{tx.description}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 text-sm py-1 px-4 rounded-full text-white ${tx.categoryColor} bg-opacity-30 w-fit`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-semibold text-right ${tx.amount > 0 ? 'text-green-400' : 'text-gray-200'}`}>
                    {tx.amount > 0 ? '+' : ''}
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-16">
                  <p className="text-gray-500 text-lg">No transactions found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;