'use client';
import React from 'react';
import { useAuth } from '@/lib/auth-provider';
import { format, parseISO } from 'date-fns';
import { PencilIcon } from '@/components/ui/PencilIcon';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RightPanel() {
  const { activeNotices, upcomingMeetings, user, isLoading: authLoading, isAdmin, isSocietyAdmin, societyInfo, updateSocietyInfo, fetchSocietyInfo } = useAuth();
  const canEditContacts = isAdmin() || isSocietyAdmin();
  // Load contacts from societyInfo
  const [contacts, setContacts] = React.useState<{ label: string; value: string }[]>([]);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editContacts, setEditContacts] = React.useState<{ label: string; value: string }[]>([]);

  // Sync contacts from societyInfo
  React.useEffect(() => {
    if (societyInfo && Array.isArray(societyInfo.importantContacts)) {
      setContacts(societyInfo.importantContacts);
    }
  }, [societyInfo]);

  const handleEditClick = () => {
    setEditContacts(contacts.length > 0 ? contacts : [
      { label: '', value: '' },
    ]);
    setEditOpen(true);
  };
  const handleEditChange = (idx: number, field: 'label' | 'value', val: string) => {
    setEditContacts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };
  const handleAddContact = () => {
    setEditContacts(prev => [...prev, { label: '', value: '' }]);
  };
  const handleRemoveContact = (idx: number) => {
    setEditContacts(prev => prev.filter((_, i) => i !== idx));
  };
  const handleEditSave = async () => {
    // Remove empty contacts
    const filtered = editContacts.filter(c => c.label.trim() && c.value.trim());
    setContacts(filtered);
    setEditOpen(false);
    // Persist to backend
    if (canEditContacts && societyInfo) {
      await updateSocietyInfo({
        ...societyInfo,
        importantContacts: filtered,
      });
      await fetchSocietyInfo();
    }
  };
  const displayedNotices = (activeNotices || []).slice(0, 3);
  const displayedMeetings = (upcomingMeetings || []).slice(0, 3);

  return (
    <aside className="w-80 min-w-[260px] max-w-xs flex flex-col gap-4 p-4 border-l border-slate-200 dark:border-slate-800 shadow-lg h-full">
      {/* Announcements */}
      <section className="rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 p-4 shadow">
        <h2 className="font-bold text-lg mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <span>Important Announcements</span>
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-200 space-y-2">
          {authLoading && <div>Loading...</div>}
          {!authLoading && displayedNotices.length === 0 && <div className="text-muted-foreground">No active announcements.</div>}
          {displayedNotices.map(notice => (
            <div key={notice.id} className="p-3 bg-white/70 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              <div className="font-semibold mb-1">{notice.title}</div>
              <div className="text-xs text-muted-foreground mb-1.5">Posted by {notice.postedByName} on {format(parseISO(notice.createdAt), 'PP')}</div>
              <div className="text-sm text-muted-foreground line-clamp-3">{notice.content}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Meetings */}
      <section className="rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 p-4 shadow">
        <h2 className="font-bold text-lg mb-2 text-green-700 dark:text-green-300 flex items-center gap-2">
          <span>Upcoming Meetings</span>
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-200 space-y-2">
          {authLoading && <div>Loading...</div>}
          {!authLoading && displayedMeetings.length === 0 && <div className="text-muted-foreground">No upcoming meetings.</div>}
          {displayedMeetings.map(meeting => (
            <div key={meeting.id} className="p-3 bg-white/70 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              <div className="font-semibold mb-1">{meeting.title}</div>
              <div className="text-xs text-muted-foreground mb-1.5">{format(parseISO(meeting.dateTime), 'PPpp')}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{meeting.locationOrLink} - {meeting.description}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Contacts */}
      <section className="rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 p-4 shadow">
        <h2 className="font-bold text-lg mb-2 text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
          <span>Important Contacts</span>
          {canEditContacts && (
            <button
              className="ml-2 p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
              aria-label="Edit Important Contacts"
              onClick={handleEditClick}
              type="button"
            >
              <PencilIcon className="w-4 h-4 text-yellow-700 dark:text-yellow-300" />
            </button>
          )}
        </h2>
        <div className="text-sm text-slate-700 dark:text-slate-200 space-y-2">
          {contacts.length === 0 && <div className="text-muted-foreground">No important contacts set.</div>}
          {contacts.map((contact, idx) => (
            <div key={idx} className="flex justify-between items-center bg-white/70 dark:bg-slate-800 rounded px-3 py-2 border border-slate-200 dark:border-slate-700">
              <span className="font-medium">{contact.label}</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{contact.value}</span>
            </div>
          ))}
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogTitle>Edit Important Contacts</DialogTitle>
            <div className="space-y-3 mt-2">
              {editContacts.map((contact, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={contact.label}
                    onChange={e => handleEditChange(idx, 'label', e.target.value)}
                    className="w-1/2"
                    placeholder="Label"
                  />
                  <Input
                    value={contact.value}
                    onChange={e => handleEditChange(idx, 'value', e.target.value)}
                    className="w-1/2"
                    placeholder="Contact Info"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveContact(idx)} aria-label="Remove Contact" type="button">×</Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddContact} type="button">Add Contact</Button>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)} type="button">Cancel</Button>
              <Button onClick={handleEditSave} type="button">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </aside>
  );
}
