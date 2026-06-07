import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Search, Trash2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/language';

export function AdminUsers() {
  const { t, tRole } = useLang();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(t('err_load_users'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (id, newRole) => {
    try {
      await api.admin.updateUserRole(id, newRole);
      toast.success(t('err_role_updated'));
      fetchUsers();
    } catch (error) {
      toast.error(t('err_update_role'));
    }
  };

  const handleSuspendToggle = async (user) => {
    try {
      await api.admin.updateUserAccount(user._id, { isSuspended: !user.isSuspended });
      toast.success(user.isSuspended ? t('user_unsuspended') : t('user_suspended'));
      fetchUsers();
    } catch (error) {
      toast.error(error.message || t('err_update_account'));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(t('confirm_delete_user'))) return;
    try {
      await api.admin.deleteUser(id);
      toast.success(t('err_user_deleted'));
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('user_management')}</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder={t('search_users_admin')} 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <tr>
                <th className="p-4 font-bold text-sm text-gray-600 dark:text-gray-300">{t('table_customer')}</th>
                <th className="p-4 font-bold text-sm text-gray-600 dark:text-gray-300">{t('table_role')}</th>
                <th className="p-4 font-bold text-sm text-gray-600 dark:text-gray-300">{t('joined_date')}</th>
                <th className="p-4 font-bold text-sm text-gray-600 dark:text-gray-300">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'vendor' ? 'secondary' : 'outline'}>
                      {tRole(user.role)}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <select 
                        className="text-xs border rounded p-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                        disabled={user.role === 'admin'}
                      >
                        <option value="customer">{tRole('customer')}</option>
                        <option value="vendor">{tRole('vendor')}</option>
                        <option value="admin">{tRole('admin')}</option>
                      </select>
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleSuspendToggle(user)}
                        >
                          {user.isSuspended ? t('unsuspend') : t('suspend')}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={user.role === 'admin'}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
