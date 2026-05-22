import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastRegion from '../components/ToastRegion';
import { Can, usePermission } from '../lib/userStore';
import { PERMS } from '../lib/permissions';
import {
  getCandidateProfile,
  listBatches,
  listCandidates,
  listCandidatesInBatches,
  listIcardAudit,
  recordIcardAudit,
} from '../lib/icardApi';
import {
  absolutifyAssets,
  buildPrintDocument,
  buildQrImageTag,
  fitScale,
  listIcardTemplates,
  loadIcardTemplate,
  renderTemplate,
  wrapForFrame,
} from '../lib/icardTemplate';

const TEMPLATE_ROOT = '/templates/id-card-student';
const PAGE_SIZE = 20;

// Walk a (possibly nested) object and return a flat list of `{ path, label }`
// entries for every leaf value.  Leaves are: strings, numbers, booleans, null,
// or arrays of those.  This drives the placeholder→field mapping dropdown.
function flattenFields(obj, prefix = '', out = []) {
  if (obj == null || typeof obj !== 'object') return out;
  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenFields(value, path, out);
    } else {
      out.push({ path, label: prettyLabel(path) });
    }
  });
  return out;
}

function prettyLabel(path) {
  return path
    .split('.')
    .map((seg) =>
      seg
        // camelCase → camel Case
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // snake_case → snake case
        .replace(/_/g, ' ')
        // Title Case
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(' › ');
}

// Heuristic auto-mapping: pick the best field match for a placeholder by
// normalising both sides (strip non-alphanum, lowercase) and looking for an
// exact match or a token containment.
function autoMatch(placeholder, fieldPaths) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(placeholder);
  if (!target) return '';
  // Exact full-path match
  const exact = fieldPaths.find((p) => norm(p) === target);
  if (exact) return exact;
  // Exact last-segment match
  const lastSeg = fieldPaths.find((p) => norm(p.split('.').pop()) === target);
  if (lastSeg) return lastSeg;
  // Contains (either direction) — pick the shortest match
  const contains = fieldPaths
    .filter((p) => {
      const n = norm(p);
      return n.includes(target) || target.includes(n);
    })
    .sort((a, b) => a.length - b.length);
  return contains[0] || '';
}

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function formatTimestamp(value) {
  if (!value) return '—';
  const num = Number(value);
  const d = Number.isFinite(num) && num > 0
    ? new Date(num < 1e11 ? num * 1000 : num)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function valuesForStudent(student, mapping, defaults, metadata) {
  const out = {};
  Object.keys(defaults).forEach((k) => { out[k] = defaults[k] || ''; });
  Object.entries(mapping).forEach(([placeholder, fieldPath]) => {
    const v = getByPath(student, fieldPath);
    if (v !== undefined && v !== null && v !== '') out[placeholder] = v;
    else if (out[placeholder] == null) out[placeholder] = '';
  });
  // If `printQR=true`, derive {{PRINT_QR}} from the value of the placeholder
  // named in `printQR.id` (e.g. STUDENT_ID).  This lets templates drop in
  // `{{PRINT_QR}}` and have it dynamically replaced by a QR code per student.
  if (metadata?.printQR && metadata?.printQRId) {
    const qrValue = out[metadata.printQRId];
    out.PRINT_QR = qrValue ? buildQrImageTag(qrValue) : '';
  }
  return out;
}

function openInNewTab(html) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site.');
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

const SAMPLE_PROFILE_ID = 1;

export default function IcardGeneratorPage() {
  const { can } = usePermission();
  const canEdit = can(PERMS.ICARD_EDIT);

  // Templates available under /templates/id-card-student/*
  const [templates, setTemplates] = useState([]);
  const [selectedTemplatePath, setSelectedTemplatePath] = useState(null);
  const [templatesError, setTemplatesError] = useState(null);

  // Active template
  const [template, setTemplate] = useState(null);
  const [templateError, setTemplateError] = useState(null);
  const [mapping, setMapping] = useState({});

  // Dynamic candidate schema, derived from a sample profile API response.
  const [sampleProfile, setSampleProfile] = useState(null);
  const [studentFields, setStudentFields] = useState([]);
  const [profileError, setProfileError] = useState(null);

  // Audit log
  const [audit, setAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Generate modal (batches)
  const [modalOpen, setModalOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchSearch, setBatchSearch] = useState('');
  const [generating, setGenerating] = useState(false);

  // Generate modal (individual students)
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState({}); // id → candidate

  // Single-student preview + edit modal
  const [singleEditOpen, setSingleEditOpen] = useState(false);
  const [singleEditStudent, setSingleEditStudent] = useState(null);
  const [singleEditValues, setSingleEditValues] = useState({}); // placeholder → string

  // Toasts
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((type, title, message) => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((cur) => [...cur, { id, type, title, message }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 4500);
  }, []);

  // Discover available templates + load a sample candidate profile once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listIcardTemplates(TEMPLATE_ROOT).catch((err) => {
        setTemplatesError(err.message || 'Could not list templates');
        return [];
      }),
      getCandidateProfile(SAMPLE_PROFILE_ID).catch((err) => {
        setProfileError(err?.response?.data?.message || err.message || 'Could not load sample candidate');
        return null;
      }),
    ]).then(([tpls, profileResp]) => {
      if (cancelled) return;
      setTemplates(tpls);
      if (tpls.length > 0) setSelectedTemplatePath(tpls[0].path);

      const profileData = profileResp?.data || profileResp || null;
      setSampleProfile(profileData);
      setStudentFields(profileData ? flattenFields(profileData) : []);
    });
    return () => { cancelled = true; };
  }, []);

  // Load (or reload) the active template whenever the user changes selection
  // or the candidate schema becomes available (so auto-mapping uses live keys).
  useEffect(() => {
    if (!selectedTemplatePath) return;
    let cancelled = false;
    setTemplate(null);
    setTemplateError(null);
    loadIcardTemplate(selectedTemplatePath)
      .then((tpl) => {
        if (cancelled) return;
        setTemplate(tpl);
        const fieldPaths = studentFields.map((f) => f.path);
        const seed = {};
        tpl.placeholders.forEach((p) => { seed[p] = autoMatch(p, fieldPaths); });
        setMapping(seed);
      })
      .catch((err) => {
        if (cancelled) return;
        setTemplateError(err.message || 'Could not load template');
      });
    return () => { cancelled = true; };
  }, [selectedTemplatePath, studentFields]);

  // Load audit log.
  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const data = await listIcardAudit({
        page,
        size: PAGE_SIZE,
        searchKey: auditSearch.trim() || undefined,
      });
      const rows = data?.data || [];
      setAudit(rows);
      setTotal(data?.meta?.total || rows.length || 0);
    } catch (err) {
      setAuditError(err?.response?.data?.message || err.message || 'Failed to load audit log');
      setAudit([]);
      setTotal(0);
    } finally {
      setAuditLoading(false);
    }
  }, [page, auditSearch]);

  // Debounce search-driven reloads so the user isn't hammering the API on
  // every keystroke. Also reset to page 1 whenever the search text changes.
  useEffect(() => {
    const timer = setTimeout(() => { loadAudit(); }, 300);
    return () => clearTimeout(timer);
  }, [loadAudit]);

  useEffect(() => { setPage(1); }, [auditSearch]);

  // Live preview using the sample profile from the API so the dropdown and
  // preview agree on the shape of the data.
  const previewValues = useMemo(() => {
    if (!template) return {};
    return valuesForStudent(sampleProfile || {}, mapping, template.metadata.placeholders, template.metadata);
  }, [template, mapping, sampleProfile]);

  const previewFront = useMemo(
    () => (template ? absolutifyAssets(renderTemplate(template.front, previewValues), template.baseHref) : ''),
    [template, previewValues]
  );
  const previewBack = useMemo(
    () => (template ? absolutifyAssets(renderTemplate(template.back, previewValues), template.baseHref) : ''),
    [template, previewValues]
  );

  // ── Individual student picker ─────────────────────────────────────────
  const openStudentsModal = useCallback(() => {
    setStudentsModalOpen(true);
    setStudentSearch('');
    setSelectedCandidates({});
  }, []);

  // Debounced search against the candidate list API while the picker is open.
  useEffect(() => {
    if (!studentsModalOpen) return undefined;
    let cancelled = false;
    setCandidatesLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await listCandidates({ page: 1, size: 50, searchKey: studentSearch.trim() || undefined });
        if (!cancelled) setCandidates(data?.data || []);
      } catch (err) {
        if (!cancelled) {
          setCandidates([]);
          showToast('error', 'Students', err?.response?.data?.message || 'Could not load students');
        }
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [studentsModalOpen, studentSearch, showToast]);

  const toggleCandidate = (cand) => {
    const id = cand.id || cand.candidateId || cand.candidateKey;
    if (!id) return;
    setSelectedCandidates((cur) => {
      const next = { ...cur };
      if (next[id]) delete next[id];
      else next[id] = cand;
      return next;
    });
  };

  const handleGenerateForSelected = useCallback(async () => {
    if (!template) {
      showToast('error', 'Template', 'Template hasn’t loaded yet.');
      return;
    }
    const ids = Object.keys(selectedCandidates);
    if (ids.length === 0) {
      showToast('error', 'Pick students', 'Select at least one student to continue.');
      return;
    }
    setGenerating(true);
    try {
      // Keep the picked-row + fetched profile + original id paired together so
      // the audit never loses the candidateId even if profile fields differ.
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const profile = await getCandidateProfile(id)
            .then((resp) => resp?.data || resp || null)
            .catch(() => null);
          return { id, cand: selectedCandidates[id], profile };
        })
      );
      const valid = pairs.filter((p) => p.profile);
      const students = valid.map((p) => p.profile);
      if (students.length === 0) {
        showToast('error', 'No profiles', 'Could not load profile data for the selected students.');
        return;
      }

      // SINGLE-STUDENT FLOW: open the edit/preview modal instead of printing
      // immediately. Pre-populate every placeholder with the resolved value so
      // the user starts from the live data and can tweak any field.
      if (students.length === 1) {
        const student = students[0];
        const baseline = valuesForStudent(student, mapping, template.metadata.placeholders, template.metadata);
        const seed = {};
        template.placeholders.forEach((p) => {
          seed[p] = baseline[p] != null ? String(baseline[p]) : '';
        });
        setSingleEditStudent(student);
        setSingleEditValues(seed);
        setStudentsModalOpen(false);
        setSingleEditOpen(true);
        return;
      }

      const html = buildPrintDocument({
        template,
        students,
        valuesFor: (s) => valuesForStudent(s, mapping, template.metadata.placeholders, template.metadata),
        title: 'Student ID Cards',
      });
      if (openInNewTab(html)) {
        showToast('success', 'Generated', `Opened ${students.length} ID card${students.length === 1 ? '' : 's'} as a PDF in a new tab.`);
        setStudentsModalOpen(false);
        recordIcardAudit(
          valid.map(({ id, cand, profile: s }) => ({
            candidateId: id,
            candidateName:
              s.name ||
              cand?.name ||
              [s.firstName, s.lastName].filter(Boolean).join(' ') ||
              '',
            type: 'Individual',
            templatePath: selectedTemplatePath,
          }))
        )
          .catch((err) => {
            showToast('error', 'Audit', err?.response?.data?.message || 'Could not record audit log.');
          })
          .finally(loadAudit);
      }
    } catch (err) {
      showToast('error', 'Generation failed', err?.response?.data?.message || err.message || 'Could not generate cards.');
    } finally {
      setGenerating(false);
    }
  }, [template, selectedCandidates, mapping, showToast, loadAudit, selectedTemplatePath]);

  // Helper: list of placeholders the user can edit in the single-student modal.
  // STUDENT_ID (whatever placeholder the QR is tied to) is locked.  PRINT_QR is
  // derived and not directly editable.
  const editablePlaceholders = useMemo(() => {
    if (!template) return [];
    const lockedId = template.metadata.printQRId;
    return template.placeholders.filter((p) => p !== lockedId && p !== 'PRINT_QR');
  }, [template]);

  // Heuristic: treat any placeholder whose name mentions PHOTO/AVATAR/IMAGE as
  // an image URL field (renders a thumbnail next to the input).
  function isPhotoField(p) {
    return /(PHOTO|AVATAR|IMAGE|PIC)/i.test(p);
  }

  // Final values used by the single-student preview + PDF: text fields from
  // singleEditValues, plus a freshly-built PRINT_QR sourced from the (locked)
  // STUDENT_ID placeholder so it always tracks the ID value.
  const singleEditEffectiveValues = useMemo(() => {
    if (!template) return {};
    const out = { ...singleEditValues };
    const idKey = template.metadata.printQRId;
    if (template.metadata.printQR && idKey) {
      const idValue = out[idKey];
      out.PRINT_QR = idValue ? buildQrImageTag(idValue) : '';
    }
    return out;
  }, [template, singleEditValues]);

  const singleEditPreviewFront = useMemo(
    () => (template ? absolutifyAssets(renderTemplate(template.front, singleEditEffectiveValues), template.baseHref) : ''),
    [template, singleEditEffectiveValues]
  );
  const singleEditPreviewBack = useMemo(
    () => (template ? absolutifyAssets(renderTemplate(template.back, singleEditEffectiveValues), template.baseHref) : ''),
    [template, singleEditEffectiveValues]
  );

  const handleConfirmSingleEdit = useCallback(() => {
    if (!template || !singleEditStudent) return;
    setGenerating(true);
    try {
      const html = buildPrintDocument({
        template,
        students: [singleEditStudent],
        // Use the edited values verbatim for this single card.
        valuesFor: () => singleEditEffectiveValues,
        title: 'Student ID Card',
      });
      if (openInNewTab(html)) {
        showToast('success', 'Generated', 'Opened ID card as a PDF in a new tab.');
        setSingleEditOpen(false);

        // Audit the EDITED values — user may have changed name/ID/etc before
        // confirming.  ID is the locked QR-id placeholder; name is best-effort
        // pieced together from common placeholders or the original profile.
        const s = singleEditStudent;
        const idKey = template.metadata.printQRId;
        const editedId = (idKey && singleEditValues[idKey])
          || s.id || s.candidateId || s.candidateKey || '';
        const editedName =
          [singleEditValues.FIRST_NAME, singleEditValues.LAST_NAME].filter(Boolean).join(' ').trim()
          || singleEditValues.NAME
          || singleEditValues.FULL_NAME
          || s.name
          || [s.firstName, s.lastName].filter(Boolean).join(' ')
          || '';

        recordIcardAudit([{
          candidateId: editedId,
          candidateName: editedName,
          type: 'Individual',
          templatePath: selectedTemplatePath,
        }])
          .catch((err) => {
            showToast('error', 'Audit', err?.response?.data?.message || 'Could not record audit log.');
          })
          .finally(loadAudit);
      }
    } finally {
      setGenerating(false);
    }
  }, [template, singleEditStudent, singleEditValues, singleEditEffectiveValues, selectedTemplatePath, showToast, loadAudit]);

  const openModal = useCallback(async () => {
    setModalOpen(true);
    setSelectedBatchIds([]);
    setBatchSearch('');
    setBatchesLoading(true);
    try {
      const data = await listBatches({ page: 1, size: 200 });
      setBatches(data?.data || []);
    } catch (err) {
      showToast('error', 'Batches', err?.response?.data?.message || 'Could not load batches');
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, [showToast]);

  const filteredBatches = useMemo(() => {
    const q = batchSearch.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b) =>
      `${b.name || ''} ${b.description || ''}`.toLowerCase().includes(q)
    );
  }, [batches, batchSearch]);

  const toggleBatch = (id) => {
    setSelectedBatchIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const handleGenerateForAll = useCallback(async () => {
    if (!template) {
      showToast('error', 'Template', 'Template hasn’t loaded yet.');
      return;
    }
    if (selectedBatchIds.length === 0) {
      showToast('error', 'Pick batches', 'Select at least one batch to continue.');
      return;
    }
    setGenerating(true);
    try {
      const data = await listCandidatesInBatches(selectedBatchIds);
      const list = data?.data || [];
      if (list.length === 0) {
        showToast('error', 'No students', 'No students were found in the selected batches.');
        return;
      }
      // Build a lookup from candidate id → batch name (from the roster row).
      const batchById = Object.fromEntries(batches.map((b) => [b.id, b]));
      const batchNameByCandidate = {};
      list.forEach((c) => {
        const id = c.id || c.candidateId || c.candidateKey;
        if (!id) return;
        batchNameByCandidate[id] =
          c.batchName || c.batch?.name ||
          (c.batchId && batchById[c.batchId]?.name) ||
          (c.batch?.id && batchById[c.batch.id]?.name) ||
          '';
      });

      // Fetch each candidate's full profile, keeping the original ID we
      // queried with — so we never lose track of `candidateId` for the audit.
      const ids = Object.keys(batchNameByCandidate);
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const profile = await getCandidateProfile(id)
            .then((resp) => resp?.data || resp || null)
            .catch(() => null);
          return { id, profile };
        })
      );
      const valid = pairs.filter((p) => p.profile);
      const students = valid.map((p) => p.profile);
      if (students.length === 0) {
        showToast('error', 'No profiles', 'Could not load profile data for the selected students.');
        return;
      }
      const html = buildPrintDocument({
        template,
        students,
        valuesFor: (s) => valuesForStudent(s, mapping, template.metadata.placeholders, template.metadata),
        title: 'Student ID Cards',
      });
      if (openInNewTab(html)) {
        showToast('success', 'Generated', `Opened ${students.length} ID card${students.length === 1 ? '' : 's'} as a PDF in a new tab.`);
        setModalOpen(false);
        // Audit one row per student.  candidateId is the EXACT id we used to
        // fetch the profile, so the row is never lost to id-field drift.
        recordIcardAudit(
          valid.map(({ id, profile: s }) => ({
            candidateId: id,
            candidateName: s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || '',
            type: batchNameByCandidate[id] || 'Batch',
            templatePath: selectedTemplatePath,
          }))
        )
          .catch((err) => {
            showToast('error', 'Audit', err?.response?.data?.message || 'Could not record audit log.');
          })
          .finally(loadAudit);
      }
    } catch (err) {
      showToast('error', 'Generation failed', err?.response?.data?.message || err.message || 'Could not generate cards.');
    } finally {
      setGenerating(false);
    }
  }, [template, selectedBatchIds, batches, mapping, showToast, loadAudit, selectedTemplatePath]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Card dimensions for preview iframes — use what the metadata declares.
  const cardW = template?.metadata.width || '85.6mm';
  const cardH = template?.metadata.height || '53.98mm';

  return (
    <div className="page-wrap" style={{ padding: 16 }}>
      <ToastRegion toasts={toasts} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>ID Card Generator</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label htmlFor="icard-template-select" style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
              Template:
            </label>
            <select
              id="icard-template-select"
              value={selectedTemplatePath || ''}
              onChange={(e) => setSelectedTemplatePath(e.target.value)}
              disabled={templates.length === 0}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, minWidth: 240 }}
            >
              {templates.length === 0 && <option value="">No templates available</option>}
              {templates.map((t) => (
                <option key={t.path} value={t.path}>{t.reference}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {template ? `${cardW} × ${cardH}` : (templatesError ? '' : 'loading…')}
            </span>
          </div>
          {templatesError && (
            <div style={{ fontSize: 12, color: '#991b1b' }}>{templatesError}</div>
          )}
        </div>
        <Can permission={PERMS.ICARD_EDIT}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={openStudentsModal} disabled={!template} style={btnGhost}>
              <i className="fa fa-user" style={{ marginRight: 6 }} />
              Generate for Individual
            </button>
            <button type="button" onClick={openModal} disabled={!template} style={btnPrimary}>
              <i className="fa fa-id-card-o" style={{ marginRight: 6 }} />
              Generate for Batches
            </button>
          </div>
        </Can>
      </div>

      {templateError && (
        <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 6, marginBottom: 16 }}>
          Couldn’t load template at <code>{selectedTemplatePath}</code>: {templateError}
        </div>
      )}

      {/* ── Template preview + placeholder mapping ─────────────────────── */}
      {template && (
        <Can
          permission={PERMS.ICARD_EDIT}
          fallback={null}
        >
          <section style={card}>
            <div style={cardHead}>Map Placeholders and Preview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 18, padding: 16 }}>
              {/* Mapping table */}
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  Map each placeholder to a data field. Defaults from pre-configured metadata are used when a student value is empty.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {template.placeholders.map((p) => (
                    <div key={p} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 12, background: '#f3f4f6', padding: '4px 8px', borderRadius: 4 }}>
                        {p}
                      </code>
                      <select
                        value={mapping[p] || ''}
                        onChange={(e) => setMapping((cur) => ({ ...cur, [p]: e.target.value }))}
                        style={{ padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="">— Use default —</option>
                        {studentFields.map((f) => (
                          <option key={f.path} value={f.path}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {studentFields.length === 0 && (
                    <div style={{ fontSize: 12, color: '#a16207', background: '#fef9c3', padding: 8, borderRadius: 4 }}>
                      Couldn't load the candidate schema{profileError ? `: ${profileError}` : ''}. Dropdown options will appear once a sample profile loads.
                    </div>
                  )}
                </div>
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>See defaults from pre-configured metadata</summary>
                  <pre style={{ fontSize: 11, background: '#f9fafb', padding: 8, borderRadius: 4, marginTop: 6, overflowX: 'auto' }}>
{Object.entries(template.metadata.placeholders)
  .map(([k, v]) => `${k} = ${v || '(empty)'}`)
  .join('\n')}
                  </pre>
                </details>
              </div>

              {/* Preview pane */}
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                  LIVE PREVIEW
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: '#f9fafb', padding: 14, borderRadius: 6 }}>
                  <PreviewFrame
                    html={previewFront} width={cardW} height={cardH}
                    canvasW={template.metadata.canvasWidth} canvasH={template.metadata.canvasHeight}
                    label="FRONT"
                  />
                  <PreviewFrame
                    html={previewBack} width={cardW} height={cardH}
                    canvasW={template.metadata.canvasWidth} canvasH={template.metadata.canvasHeight}
                    label="BACK"
                  />
                </div>
              </div>
            </div>
          </section>
        </Can>
      )}

      {/* ── History table ─────────────────────────────────────────────── */}
      <section style={{ ...card, marginTop: 16 }}>
        <div style={{ ...cardHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>Generate History</span>
          <input
            type="search"
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            placeholder="Search by student, admin, type…"
            style={{
              padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6,
              fontSize: 12, minWidth: 240, background: '#fff', fontWeight: 400,
            }}
          />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f9fafb', color: '#6b7280' }}>
              <th style={th}>ID</th>
              <th style={th}>Student</th>
              <th style={th}>Type</th>
              <th style={th}>Style</th>
              <th style={th}>Date</th>
              <th style={th}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {auditLoading && <tr><td colSpan={6} style={td}>Loading…</td></tr>}
            {!auditLoading && audit.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...td, color: '#6b7280', textAlign: 'center', padding: 32 }}>
                  {auditError
                    ? `No audit log available (${auditError}).`
                    : 'No ID cards have been printed yet.'}
                  {canEdit && !auditError && (
                    <div style={{ marginTop: 8 }}>
                      <button type="button" onClick={openModal} style={linkBtn}>
                        Print your first batch →
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
            {!auditLoading && audit.map((row, idx) => {
              const id = row.candidateId || row.studentId || row.id || '—';
              const name = row.candidateName || row.studentName || row.name || '—';
              const type = row.type || row.batchName || 'Individual';
              const printedAt = row.printedAt || row.createdAt || row.generatedAt;
              const admin = row.admin || row.adminName || row.generatedByName || row.createdByName || '—';
              const tplPath = row.templatePath || '';
              const matched = templates.find((t) => t.path === tplPath);
              // Prefer the resolved `reference` from metadata; fall back to
              // the last path segment (e.g. "template-1") when unknown.
              const style = matched?.reference
                || matched?.metadata?.reference
                || (tplPath ? tplPath.split('/').filter(Boolean).pop() : '—');
              return (
                <tr key={row.id || `${id}-${printedAt}-${idx}`} style={{ borderTop: '1px solid #f1f4f9' }}>
                  <td style={{ ...td, fontFamily: 'ui-monospace, monospace' }}>{id}</td>
                  <td style={td}>{name}</td>
                  <td style={td}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: type === 'Individual' ? '#fef3c7' : '#dbeafe',
                      color: type === 'Individual' ? '#92400e' : '#1d4ed8',
                    }}>
                      {type}
                    </span>
                  </td>
                  <td style={td} title={tplPath || undefined}>{style}</td>
                  <td style={td}>printed on {formatTimestamp(printedAt)}</td>
                  <td style={td}>{admin}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: 10, borderTop: '1px solid #e5e7eb' }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={pgBtn}>Prev</button>
            <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={pgBtn}>Next</button>
          </div>
        )}
      </section>

      {/* ── Generate modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div style={overlay} onClick={() => !generating && setModalOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Generate ID Cards</h2>
              <button type="button" onClick={() => !generating && setModalOpen(false)} style={closeBtn}>×</button>
            </div>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
              Pick one or more batches. A PDF with one page per student (front &amp; back side-by-side) will open in a new tab.
            </p>
            <input
              type="search"
              placeholder="Search batches…"
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 10, fontSize: 13 }}
            />
            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              {batchesLoading && <div style={{ padding: 14, color: '#6b7280' }}>Loading batches…</div>}
              {!batchesLoading && filteredBatches.length === 0 && (
                <div style={{ padding: 14, color: '#6b7280' }}>No batches found.</div>
              )}
              {!batchesLoading && filteredBatches.map((b) => {
                const checked = selectedBatchIds.includes(b.id);
                return (
                  <label key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderBottom: '1px solid #f1f4f9', cursor: 'pointer',
                    background: checked ? '#eff6ff' : 'transparent',
                  }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleBatch(b.id)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{b.name || b.id}</div>
                      {b.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{b.description}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {b.totalStudents ?? b.studentCount ?? ''}
                    </span>
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{selectedBatchIds.length} batch(es) selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setModalOpen(false)} disabled={generating} style={btnGhost}>Cancel</button>
                <button type="button" onClick={handleGenerateForAll} disabled={generating || selectedBatchIds.length === 0} style={btnPrimary}>
                  {generating ? 'Generating…' : 'Generate for All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Students picker modal ─────────────────────────────────────── */}
      {studentsModalOpen && (
        <div style={overlay} onClick={() => !generating && setStudentsModalOpen(false)}>
          <div style={modalWide} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Generate ID Cards for Selected Students</h2>
              <button type="button" onClick={() => !generating && setStudentsModalOpen(false)} style={closeBtn}>×</button>
            </div>
            <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 13 }}>
              Search and pick one or more students. A PDF with one page per student (front &amp; back side-by-side) will open in a new tab.
            </p>
            {Object.keys(selectedCandidates).length > 0 && (
              <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 10px', borderRadius: 4, fontSize: 12, marginBottom: 10 }}>
                <i className="fa fa-check" style={{ marginRight: 6 }} />
                {Object.keys(selectedCandidates).length} student(s) selected
              </div>
            )}
            <input
              type="search"
              placeholder="Search by name, email, or phone…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 10, fontSize: 13 }}
              autoFocus
            />
            <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              {candidatesLoading && <div style={{ padding: 14, color: '#6b7280' }}>Loading students…</div>}
              {!candidatesLoading && candidates.length === 0 && (
                <div style={{ padding: 14, color: '#6b7280', textAlign: 'center' }}>
                  {studentSearch ? 'No students match your search.' : 'No students found.'}
                </div>
              )}
              {!candidatesLoading && candidates.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: '#f9fafb', color: '#6b7280' }}>
                      <th style={{ ...th, width: 38 }}>
                        <input
                          type="checkbox"
                          checked={
                            candidates.length > 0 &&
                            candidates.every((c) => selectedCandidates[c.id || c.candidateId || c.candidateKey])
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedCandidates((cur) => {
                              const next = { ...cur };
                              candidates.forEach((c) => {
                                const id = c.id || c.candidateId || c.candidateKey;
                                if (!id) return;
                                if (checked) next[id] = c;
                                else delete next[id];
                              });
                              return next;
                            });
                          }}
                        />
                      </th>
                      <th style={th}>Student</th>
                      <th style={th}>Email</th>
                      <th style={th}>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const id = c.id || c.candidateId || c.candidateKey;
                      const isSelected = Boolean(selectedCandidates[id]);
                      return (
                        <tr
                          key={id}
                          onClick={() => toggleCandidate(c)}
                          style={{
                            borderTop: '1px solid #f1f4f9',
                            cursor: 'pointer',
                            background: isSelected ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <td style={{ ...td, width: 38 }} onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleCandidate(c)} />
                          </td>
                          <td style={td}>
                            <div style={{ fontWeight: 600 }}>{c.name || 'Unknown'}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>ID: {id}</div>
                          </td>
                          <td style={{ ...td, color: '#374151' }}>{c.email || '—'}</td>
                          <td style={{ ...td, color: '#374151' }}>{c.mobile || c.registeredMobile || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{Object.keys(selectedCandidates).length} student(s) selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setStudentsModalOpen(false)} disabled={generating} style={btnGhost}>Cancel</button>
                <button type="button" onClick={handleGenerateForSelected} disabled={generating || Object.keys(selectedCandidates).length === 0} style={btnPrimary}>
                  {generating ? 'Generating…' : `Generate (${Object.keys(selectedCandidates).length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Single-student preview + edit modal ───────────────────────── */}
      {singleEditOpen && template && (
        <div style={overlay} onClick={() => !generating && setSingleEditOpen(false)}>
          <div style={modalWide} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>
                Review &amp; Edit — {singleEditStudent?.name || 'Student'}
              </h2>
              <button type="button" onClick={() => !generating && setSingleEditOpen(false)} style={closeBtn}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 18 }}>
              {/* Editable fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto', paddingRight: 6 }}>
                {template.metadata.printQRId && (
                  <div>
                    <label style={editLabel}>
                      {prettyLabel(template.metadata.printQRId)} <span style={{ color: '#9ca3af', fontWeight: 400 }}></span>
                    </label>
                    <input
                      type="text"
                      value={singleEditValues[template.metadata.printQRId] || ''}
                      readOnly
                      style={{ ...editInput, background: '#f3f4f6', color: '#6b7280' }}
                    />
                  </div>
                )}

                {editablePlaceholders.map((p) => {
                  const isPhoto = isPhotoField(p);
                  const value = singleEditValues[p] || '';
                  return (
                    <div key={p}>
                      <label style={editLabel}>
                        {prettyLabel(p)} {isPhoto ? <span style={{ color: '#9ca3af', fontWeight: 400 }}>(image URL)</span> : null}
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {isPhoto && (
                          <div style={{
                            width: 44, height: 44, borderRadius: 4, border: '1px solid #e5e7eb',
                            background: value ? `url(${JSON.stringify(value)}) center/cover no-repeat` : '#f3f4f6',
                            flexShrink: 0,
                          }} />
                        )}
                        <input
                          type={isPhoto ? 'url' : 'text'}
                          value={value}
                          placeholder={isPhoto ? 'https://…' : ''}
                          onChange={(e) =>
                            setSingleEditValues((cur) => ({ ...cur, [p]: e.target.value }))
                          }
                          style={editInput}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live preview */}
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Live preview</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: '#f9fafb', padding: 14, borderRadius: 6 }}>
                  <PreviewFrame
                    html={singleEditPreviewFront} width={cardW} height={cardH}
                    canvasW={template.metadata.canvasWidth} canvasH={template.metadata.canvasHeight}
                    label="FRONT"
                  />
                  <PreviewFrame
                    html={singleEditPreviewBack} width={cardW} height={cardH}
                    canvasW={template.metadata.canvasWidth} canvasH={template.metadata.canvasHeight}
                    label="BACK"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, borderTop: '1px solid #f1f4f9', paddingTop: 12 }}>
              <button type="button" onClick={() => setSingleEditOpen(false)} disabled={generating} style={btnGhost}>Cancel</button>
              <button type="button" onClick={handleConfirmSingleEdit} disabled={generating} style={btnPrimary}>
                {generating ? 'Generating…' : 'Confirm & Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const editLabel = { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 };
const editInput = { flex: 1, width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' };

function PreviewFrame({ html, width, height, canvasW, canvasH, label }) {
  // The preview box is sized to the EXACT physical card dimensions from
  // metadata.txt (e.g. 86.3mm × 53.3mm).  The template markup is rendered
  // directly via dangerouslySetInnerHTML into an inner div at canvas size,
  // then `transform: scale()` shrinks it to fit the box — no iframe, so no
  // scrollbars are possible.
  const hasCanvas = Boolean(canvasW && canvasH);
  const scale = hasCanvas ? fitScale(canvasW, canvasH, width, height) : 1;
  const wrapperStyle = {
    width, height,
    position: 'relative', overflow: 'hidden',
    background: '#fff',
    border: '1px solid #c5cad3', borderRadius: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };
  const innerStyle = hasCanvas
    ? {
        position: 'absolute', top: 0, left: 0,
        width: canvasW, height: canvasH,
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }
    : { position: 'absolute', top: 0, left: 0, width, height };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={wrapperStyle}>
        <div
          title={label}
          style={innerStyle}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#6b7280', letterSpacing: 0.5 }}>
        {label} · {width} × {height}{hasCanvas ? ` (canvas ${canvasW} × ${canvasH})` : ''}
      </span>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' };
const cardHead = { padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13, fontWeight: 600, color: '#374151' };
const th = { padding: '10px 14px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { padding: '10px 14px', verticalAlign: 'middle' };
const pgBtn = { padding: '4px 10px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12 };
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal = {
  background: '#fff', borderRadius: 10, padding: 18, width: 'min(560px, 92vw)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
};
const modalWide = {
  background: '#fff', borderRadius: 10, padding: 18, width: 'min(820px, 95vw)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
};
const btnPrimary = { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' };
const btnGhost = { background: '#f3f4f6', color: '#111', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' };
const linkBtn = { background: 'transparent', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: 600 };
const closeBtn = { background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280' };
