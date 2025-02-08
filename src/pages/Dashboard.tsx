import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="h-10 w-10 rounded-full"
              />
              <span className="text-gray-700">{user?.name}</span>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Welcome to your dashboard!</p>
          </div>
        </div>
      </div>
    </div>
  );
}