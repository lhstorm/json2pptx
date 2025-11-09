'use client';

import { useState } from 'react';
import { Project, SharingSettings } from '@/types/presentation';
import { createShareLink, generateShareUrl, revokeShareLink } from '@/lib/sharing';
import { X, Copy, Check, Link2, Lock, Calendar, Download, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  project: Project;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ project, userId, isOpen, onClose }: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(project.sharing?.isPublic || false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [allowComments, setAllowComments] = useState(project.sharing?.allowComments ?? true);
  const [allowDownload, setAllowDownload] = useState(project.sharing?.allowDownload ?? true);
  const [shareUrl, setShareUrl] = useState<string | null>(
    project.sharing?.shareId ? generateShareUrl(project.sharing.shareId) : null
  );
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const settings: Partial<SharingSettings> = {
        isPublic: true,
        password: password || undefined,
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
        allowComments,
        allowDownload,
      };

      const shareId = await createShareLink(project.id, userId, settings);
      const url = generateShareUrl(shareId);
      setShareUrl(url);
      setIsPublic(true);
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeLink = async () => {
    if (!project.sharing?.shareId) return;

    try {
      await revokeShareLink(project.id, userId, project.sharing.shareId);
      setShareUrl(null);
      setIsPublic(false);
    } catch (error) {
      console.error('Error revoking share link:', error);
      alert('Failed to revoke share link');
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share Presentation</h2>
            <p className="text-sm text-gray-600 mt-1">{project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link Section */}
          {shareUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Link2 className="w-5 h-5" />
                <span className="font-semibold">Your presentation is public</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <button
                onClick={handleRevokeLink}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Revoke link
              </button>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Create a public link to share this presentation
              </p>
              <button
                onClick={handleCreateLink}
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          )}

          {/* Privacy Settings */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold text-gray-900">Privacy & Permissions</h3>

            {/* Password Protection */}
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Protection (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Expiration */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Expiration
                </label>
                <select
                  value={expiresIn || ''}
                  onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Never expires</option>
                  <option value={86400000}>1 day</option>
                  <option value={604800000}>7 days</option>
                  <option value={2592000000}>30 days</option>
                </select>
              </div>
            </div>

            {/* Allow Comments */}
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Allow comments
                </span>
              </label>
            </div>

            {/* Allow Download */}
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-600" />
              <label className="flex items-center cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Allow download
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          {!shareUrl && (
            <button
              onClick={handleCreateLink}
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Link'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
