import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormScreen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { colors, space, type } from '@/lib/design-system/tokens';

const SUPPORT_EMAIL = 'support@preemietrack.app';

const faqs = [
  {
    question: 'How is corrected age calculated?',
    answer:
      'Corrected age adjusts your baby’s actual age by how early they were born, counting from their full-term due date rather than their birth date. It’s shown alongside actual age wherever age appears, and stays negative until your baby reaches the due date — that’s expected for a preterm baby, not an error.',
  },
  {
    question: 'What happens if I log an entry while offline?',
    answer:
      'Everything you track — feedings, sleep, diapers, weight, and more — saves to your device first, so it works without a connection. It syncs automatically the next time you’re online. If the same entry was edited on two devices, you’ll see it under Sync Conflicts so you can pick which version to keep.',
  },
  {
    question: 'Who can see the data I share?',
    answer:
      'Only people you explicitly invite from Share Data can see your baby’s information, and only with the permission level you grant them. You can revoke access at any time from that same screen.',
  },
  {
    question: 'Can I get a copy of all my data?',
    answer:
      'Yes — go to Settings → Your data → Export my data to download everything stored for your account.',
  },
  {
    question: 'How do I stop reminder notifications?',
    answer:
      'Turn individual reminders off from the Reminders screen, or disable notifications entirely from Settings → Notifications.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ gap: space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={question}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
      >
        <Text
          style={{ flex: 1, fontSize: type.label, fontWeight: '700', color: colors.text }}
        >
          {question}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {open && (
        <Text style={{ color: colors.muted, fontSize: type.caption, lineHeight: 19 }}>
          {answer}
        </Text>
      )}
    </Card>
  );
}

export default function Help() {
  return (
    <FormScreen>
      <ScreenHeader title="Help & Support" back />

      <Card style={{ gap: space.sm }}>
        <Text style={{ fontSize: type.label, fontWeight: '700', color: colors.text }}>
          Contact us
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.caption }}>
          Can’t find what you need, or something isn’t working right? Reach out and a team
          member will get back to you.
        </Text>
        <Button
          onPress={async () => {
            const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('PreemieTrack support')}`;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              Linking.openURL(url);
            } else {
              Alert.alert('Email us', SUPPORT_EMAIL);
            }
          }}
        >
          Email support
        </Button>
      </Card>

      <Text style={{ fontSize: type.label, fontWeight: '800', color: colors.text }}>
        Frequently asked questions
      </Text>
      {faqs.map((faq) => (
        <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
      ))}

      <View style={{ paddingVertical: space.md }}>
        <Text style={{ color: colors.muted, fontSize: type.caption, textAlign: 'center' }}>
          PreemieTrack is not a substitute for medical advice. In an emergency, contact your
          care team or local emergency services.
        </Text>
      </View>
    </FormScreen>
  );
}
