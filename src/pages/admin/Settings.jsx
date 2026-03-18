import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AdminNavbar from '../../components/AdminNavbar';

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const NumberField = ({ label, description, value, onChange, min, max, unit }) => (
  <div className="py-3">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
        />
        {unit && <span className="text-xs text-gray-500 w-16">{unit}</span>}
      </div>
    </div>
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings`);
      setSettings(res.data.data || res.data.settings || res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const update = (path, value) => {
    setSettings((prev) => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      return {
        ...prev,
        [parts[0]]: { ...prev[parts[0]], [parts[1]]: value },
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/settings`, settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 mb-4">{error || 'Settings not available'}</p>
          <button onClick={fetchSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Derive nested values with safe fallbacks
  const exam = settings.exam || settings.examSettings || {};
  const proctor = settings.proctoring || settings.proctoringSettings || {};
  const security = settings.security || settings.securitySettings || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure global exam portal settings</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Global Exam Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Global Exam Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Default settings applied to all exams</p>

            <div className="divide-y divide-gray-100">
              <div className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Default Video Quality</p>
                    <p className="text-xs text-gray-500 mt-0.5">Quality of proctoring video recordings</p>
                  </div>
                  <select
                    value={exam.defaultVideoQuality || settings.defaultVideoQuality || 'medium'}
                    onChange={(e) => update(settings.exam !== undefined ? 'exam.defaultVideoQuality' : 'defaultVideoQuality', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <NumberField
                label="Max Face Violations"
                description="Number of face detection violations before exam termination"
                value={exam.maxFaceViolations ?? settings.maxFaceViolations ?? 5}
                onChange={(v) => update(settings.exam !== undefined ? 'exam.maxFaceViolations' : 'maxFaceViolations', v)}
                min={1}
                max={100}
                unit="violations"
              />

              <Toggle
                label="Require Camera"
                description="Students must have a camera enabled to take exams"
                checked={exam.requireCamera ?? settings.requireCamera ?? true}
                onChange={(v) => update(settings.exam !== undefined ? 'exam.requireCamera' : 'requireCamera', v)}
              />

              <Toggle
                label="Require Microphone"
                description="Students must have a microphone enabled to take exams"
                checked={exam.requireMicrophone ?? settings.requireMicrophone ?? false}
                onChange={(v) => update(settings.exam !== undefined ? 'exam.requireMicrophone' : 'requireMicrophone', v)}
              />
            </div>
          </div>

          {/* Proctoring Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Proctoring Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Configure AI proctoring behaviour</p>

            <div className="divide-y divide-gray-100">
              <Toggle
                label="Enable AI Proctoring"
                description="Automatically detect suspicious behaviour during exams"
                checked={proctor.enableAIProctoring ?? settings.enableAIProctoring ?? true}
                onChange={(v) => update(settings.proctoring !== undefined ? 'proctoring.enableAIProctoring' : 'enableAIProctoring', v)}
              />

              <NumberField
                label="Screenshot Interval"
                description="How often to capture screenshots during an exam"
                value={proctor.screenshotInterval ?? settings.screenshotInterval ?? 30}
                onChange={(v) => update(settings.proctoring !== undefined ? 'proctoring.screenshotInterval' : 'screenshotInterval', v)}
                min={5}
                unit="seconds"
              />

              <NumberField
                label="Face Detection Interval"
                description="Frequency of face detection checks"
                value={proctor.faceDetectionInterval ?? settings.faceDetectionInterval ?? 3000}
                onChange={(v) => update(settings.proctoring !== undefined ? 'proctoring.faceDetectionInterval' : 'faceDetectionInterval', v)}
                min={500}
                unit="ms"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Security Settings</h2>
            <p className="text-sm text-gray-500 mb-4">Account and session security configuration</p>

            <div className="divide-y divide-gray-100">
              <NumberField
                label="Max Login Attempts"
                description="Account lockout after this many failed login attempts"
                value={security.maxLoginAttempts ?? settings.maxLoginAttempts ?? 5}
                onChange={(v) => update(settings.security !== undefined ? 'security.maxLoginAttempts' : 'maxLoginAttempts', v)}
                min={1}
                max={20}
                unit="attempts"
              />

              <NumberField
                label="Session Timeout"
                description="Automatically log out inactive users after this duration"
                value={security.sessionTimeout ?? settings.sessionTimeout ?? 60}
                onChange={(v) => update(settings.security !== undefined ? 'security.sessionTimeout' : 'sessionTimeout', v)}
                min={5}
                unit="minutes"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pb-8">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;