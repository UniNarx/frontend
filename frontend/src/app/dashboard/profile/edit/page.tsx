// src/app/dashboard/profile/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

// Тип для ответа от /api/users/me
type UserMeResponse = {
  message?: string; // Опционально, если есть
  data: {
    id: string;
    username: string;
    roleId: string;
    roleName: string;
  };
};

// Тип для ответа при успешном обновлении (если API что-то возвращает)
// Если API возвращает 200 ОК или 204 No Content без тела, то можно использовать <void>
type UpdateUserResponse = { // Или void, если тело ответа пустое
    message?: string;
    // Можно ожидать обновленный объект пользователя, если API его возвращает
    // user?: { username: string; ... }
};


export default function ProfileEditPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState(''); // Для отслеживания изменений
  const [error, setError] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* — glassmorphism styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnSave     = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50";
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2";

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    apiFetch<UserMeResponse>('/users/me') // Используем обновленный тип
      .then(response => {
        if (response && response.data && response.data.username) {
          setUsername(response.data.username);
          setInitialUsername(response.data.username); // Сохраняем начальное имя
        } else {
          throw new Error("Не удалось получить имя пользователя.");
        }
      })
      .catch(e => {
        console.error("Ошибка загрузки профиля:", e);
        setError(e.message || "Не удалось загрузить данные профиля.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => { // Переименовал handle в handleSubmit
    e.preventDefault();
    if (!username.trim()) {
        setError("Имя пользователя не может быть пустым.");
        return;
    }
    if (username.trim() === initialUsername) {
        setError("Новое имя пользователя совпадает со старым.");
        return;
    }

    setSaving(true);
    setError(null);
    try {
      // Бэкенд должен ожидать { username: "новое_имя" }
      await apiFetch<UpdateUserResponse>('/users/me', { // Указываем ожидаемый тип ответа
        method: 'PUT',
        body: JSON.stringify({ username: username.trim() }), // Отправляем только username
      });
      alert("Имя пользователя успешно изменено!");
      router.push('/dashboard/profile'); // Перенаправляем на страницу профиля
    } catch (err: any) {
      console.error("Ошибка сохранения имени пользователя:", err);
      setError(err.message || "Не удалось сохранить изменения.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-300">Загрузка данных профиля...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Сменить username
        </h1>

        {error && <div className={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Username</span>
            <input
              type="text" // Добавил type
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={glassInput}
              placeholder="Новое имя пользователя"
              required
              disabled={isLoading} // Блокируем во время начальной загрузки
            />
          </label>

          <button
            type="submit"
            disabled={saving || isLoading || username.trim() === initialUsername || !username.trim()} // Кнопка неактивна, если нет изменений или пусто
            className={`${btnBase} ${btnSave}`}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}