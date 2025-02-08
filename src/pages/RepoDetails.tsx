import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function RepoDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const repo = location.state?.repo;

  if (!repo) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{repo.name}</h1>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">{repo.description || 'No description available.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}