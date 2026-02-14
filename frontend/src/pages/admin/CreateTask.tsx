import React, { useState } from 'react';
import { TaskForm } from '../../components/admin/TaskForm';
import { adminApiService } from '../../services/adminApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await adminApiService.createTask(data);
      toast.success('Task created successfully!');
      navigate('/admin/tasks');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-6">
        Create New Task
      </h1>
      <TaskForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

