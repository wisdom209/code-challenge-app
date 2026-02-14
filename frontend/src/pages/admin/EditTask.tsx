import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApiService } from '../../services/adminApi';
import { TaskForm } from '../../components/admin/TaskForm';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { toast } from 'react-hot-toast';

export const EditTask: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;
      try {
        const response = await adminApiService.getTaskById(id);
        setInitialData(response.data);
      } catch (error) {
        toast.error('Failed to load task');
        navigate('/admin/tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      await adminApiService.updateTask(id, data);
      toast.success('Task updated successfully!');
      navigate('/admin/tasks');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-6">
        Edit Task
      </h1>
      {initialData && (
        <TaskForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

