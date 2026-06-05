import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastRegion from '../components/ToastRegion';
import { listRoles, extractApiError } from '../lib/rbacApi';
import UsersTab from './permissions/UsersTab';

function normalizeRole(r) {
  return {
    id: r?.id,
    name: r?.key,
    label: r?.label || r?.key,
    badgeColor: r?.badge_color || null,
  };
}

export default function UserAccountsPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);

  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((type, title, message) => {
    const id = ++toastIdRef.current;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4500);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await listRoles();
        if (cancelled) return;
        setRoles((resp?.data || []).map(normalizeRole).filter((r) => r.id != null && r.name));
      } catch (err) {
        if (cancelled) return;
        const info = extractApiError(err);
        if (info.status === 401) { navigate('/login', { replace: true }); return; }
        showToast('error', 'Could not load roles', info.message);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, showToast]);

  return (
    <div className="data-table-page">
      <UsersTab roles={roles} showToast={showToast} />

      <ToastRegion
        toasts={toasts}
        onDismiss={(id) => setToasts((cur) => cur.filter((t) => t.id !== id))}
      />
    </div>
  );
}
