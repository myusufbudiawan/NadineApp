import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, radius, space, type } from '@/lib/design-system/tokens';
import { supabase } from '@/lib/supabase/client';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    initialMode === 'signup' ? 'signup' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(undefined);
    setSubmitting(true);
    try {
      const { error: authError } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(friendlyMessage(authError.message));
        return;
      }
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: space.xl,
        paddingTop: insets.top + space.xl,
        justifyContent: 'center',
        gap: space.lg,
      }}
    >
      <View>
        <Text style={{ fontSize: type.title, fontWeight: '800', color: colors.text }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </Text>
        <Text style={{ color: colors.muted, fontSize: type.body, marginTop: space.sm }}>
          {mode === 'signin'
            ? 'Sign in to sync your baby’s data across devices.'
            : 'Your data stays private to your account and syncs across your devices.'}
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <TextInput
          accessibilityLabel="Email"
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={inputStyle}
        />
        <TextInput
          accessibilityLabel="Password"
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          style={inputStyle}
        />
      </View>

      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: type.caption }}>
          {error}
        </Text>
      )}

      <Button disabled={submitting || !email || !password} onPress={submit}>
        {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </Button>

      <Text
        accessibilityRole="link"
        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        style={{ textAlign: 'center', color: colors.violet, fontSize: type.label, fontWeight: '700' }}
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </Text>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.sm,
  minHeight: 50,
  paddingHorizontal: space.md,
  fontSize: type.body,
  color: colors.text,
  backgroundColor: colors.white,
};

function friendlyMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/already registered/i.test(message)) return 'An account with this email already exists.';
  if (/password/i.test(message) && /least/i.test(message)) {
    return 'Password must be at least 6 characters.';
  }
  return message;
}
