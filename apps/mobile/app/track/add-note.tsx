import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { NotesInput } from '@/components/forms/NotesInput';
import { TimePicker } from '@/components/forms/TimePicker';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import {
  deleteCareEvent,
  editCareEvent,
  saveCareEvent,
} from '@/features/care-events/storage';
import { useEditableEntry } from '@/features/care-events/useEditableEntry';
import { confirmDestructive } from '@/lib/confirm';
import { colors, space } from '@/lib/design-system/tokens';

export default function AddNote() {
  const { id, existing, loading } = useEditableEntry('note');
  const [time, setTime] = useState(new Date());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setTime(new Date(existing.occurredAt));
      setNote(existing.notes ?? '');
    }
  }, [existing]);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: space.xl, backgroundColor: colors.canvas }}>
        <Text style={{ color: colors.muted }}>Loading…</Text>
      </View>
    );
  }

  const save = async () => {
    if (!note.trim()) {
      Alert.alert('Add a note first', 'Write something before saving.');
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await editCareEvent(id, { occurredAt: time, notes: note.trim() });
      } else {
        await saveCareEvent({
          babyId: LOCAL_BABY_ID,
          type: 'note',
          occurredAt: time,
          data: {},
          notes: note.trim(),
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('Could not save note', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: space.xl,
        gap: space.lg,
        backgroundColor: colors.canvas,
      }}
    >
      <ScreenHeader title={id ? 'Edit Note' : 'Add Note'} back />
      <TimePicker label="Time" value={time} onChange={setTime} />
      <NotesInput label="Note" placeholder="What's on your mind?" value={note} onChange={setNote} minHeight={140} />
      <View style={{ marginTop: 'auto', gap: space.md }}>
        <Button onPress={save} disabled={saving}>
          {saving ? 'Saving…' : id ? 'Save changes' : 'Save'}
        </Button>
        {id && (
          <Button
            variant="destructive"
            onPress={() =>
              confirmDestructive('Delete this note?', 'This cannot be undone.', async () => {
                await deleteCareEvent(id);
                router.back();
              })
            }
          >
            Delete note
          </Button>
        )}
      </View>
    </View>
  );
}
