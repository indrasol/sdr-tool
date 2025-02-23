import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, FileText, Shield, PlusCircle } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">
        Welcome to SecureTrack
      </h1>
      <p className="text-lg text-gray-600 text-center mb-12">
        Your one-stop solution for managing and securing your projects.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="flex flex-col items-center">
            <Globe className="w-12 h-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Dashboard</h2>
            <p className="text-gray-600 text-center mb-4">
              View and manage all your projects in one place.
            </p>
            <Link to="/dashboard">
              <Button variant="default" size="sm">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Documents</h2>
            <p className="text-gray-600 text-center mb-4">
              Manage and organize your project documents.
            </p>
            <Link to="/documents">
              <Button variant="default" size="sm">
                Go to Documents
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="flex flex-col items-center">
            <Shield className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">SOC 2</h2>
            <p className="text-gray-600 text-center mb-4">
              Ensure your projects comply with SOC 2 standards.
            </p>
            <Link to="/assessments">
              <Button variant="default" size="sm">
                Go to SOC 2
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-2xl p-6 bg-white">
          <CardContent className="flex flex-col items-center">
            <PlusCircle className="w-12 h-12 text-purple-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Create Project</h2>
            <p className="text-gray-600 text-center mb-4">
              Start a new project and manage it efficiently.
            </p>
            <Link to="/create-project">
              <Button variant="default" size="sm">
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;